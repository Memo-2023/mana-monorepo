"""Model-alias registry.

Loads `aliases.yaml` and exposes a small API the router uses to resolve
semantic model names like ``mana/long-form`` to an ordered list of
concrete provider-prefixed model strings (``ollama/gemma3:12b`` →
``groq/llama-3.3-70b-versatile`` → …).

The registry is hot-reloadable: ``reload()`` rebuilds the in-memory
mapping atomically. Reload errors leave the previous good state intact
so a typo in the yaml file doesn't take the service down — caller logs
the error and keeps serving.

See docs/plans/llm-fallback-aliases.md for the full design.
"""

from __future__ import annotations

import logging
import threading
from dataclasses import dataclass
from pathlib import Path

import yaml

logger = logging.getLogger(__name__)

# Aliases live in this namespace. Anything else passed as `model` is
# treated as a direct provider/model string (preserves the legal
# bypass-the-alias-layer escape hatch for tests/debugging).
ALIAS_PREFIX = "mana/"


@dataclass(frozen=True)
class Alias:
    """A resolved alias entry."""

    name: str
    description: str
    chain: tuple[str, ...]


class AliasConfigError(ValueError):
    """Raised when the YAML file is malformed or violates schema constraints."""


class UnknownAliasError(KeyError):
    """Raised when a caller asks for an alias that isn't defined."""


def _validate_chain(name: str, chain: object) -> tuple[str, ...]:
    """Schema-check a single alias chain. Returns the validated tuple."""
    if not isinstance(chain, list):
        raise AliasConfigError(f"alias '{name}': chain must be a list, got {type(chain).__name__}")
    if not chain:
        raise AliasConfigError(f"alias '{name}': chain must not be empty")
    out: list[str] = []
    for i, entry in enumerate(chain):
        if not isinstance(entry, str) or not entry.strip():
            raise AliasConfigError(
                f"alias '{name}': chain[{i}] must be a non-empty string, got {entry!r}"
            )
        if "/" not in entry:
            raise AliasConfigError(
                f"alias '{name}': chain[{i}] = {entry!r} must include a provider prefix "
                f"(e.g. 'ollama/...', 'groq/...')"
            )
        out.append(entry.strip())
    return tuple(out)


def _validate_name(name: object) -> str:
    """Aliases must live in the reserved `mana/` namespace."""
    if not isinstance(name, str) or not name.startswith(ALIAS_PREFIX):
        raise AliasConfigError(
            f"alias name {name!r} must start with {ALIAS_PREFIX!r} (the reserved namespace)"
        )
    suffix = name[len(ALIAS_PREFIX) :]
    if not suffix or "/" in suffix:
        raise AliasConfigError(
            f"alias name {name!r} must have exactly one segment after {ALIAS_PREFIX!r}"
        )
    return name


def _parse_document(doc: object) -> tuple[dict[str, Alias], str | None]:
    """Parse a loaded YAML document into a normalized (aliases, default) pair."""
    if not isinstance(doc, dict):
        raise AliasConfigError(f"yaml root must be a mapping, got {type(doc).__name__}")

    raw_aliases = doc.get("aliases", {})
    if not isinstance(raw_aliases, dict):
        raise AliasConfigError(
            f"`aliases` must be a mapping, got {type(raw_aliases).__name__}"
        )
    if not raw_aliases:
        raise AliasConfigError("`aliases` is empty — at least one alias is required")

    parsed: dict[str, Alias] = {}
    for name, body in raw_aliases.items():
        validated_name = _validate_name(name)
        if not isinstance(body, dict):
            raise AliasConfigError(
                f"alias '{validated_name}': body must be a mapping, got {type(body).__name__}"
            )
        description = body.get("description", "")
        if not isinstance(description, str):
            raise AliasConfigError(
                f"alias '{validated_name}': description must be a string"
            )
        chain = _validate_chain(validated_name, body.get("chain"))
        parsed[validated_name] = Alias(
            name=validated_name,
            description=description.strip(),
            chain=chain,
        )

    default = doc.get("default")
    if default is not None:
        if not isinstance(default, str):
            raise AliasConfigError(f"`default` must be a string, got {type(default).__name__}")
        if default not in parsed:
            raise AliasConfigError(
                f"`default` references unknown alias {default!r} "
                f"(known: {sorted(parsed)})"
            )

    return parsed, default


class AliasRegistry:
    """Thread-safe in-memory registry of model aliases.

    Construct once at startup with the path to the yaml file. Call
    :meth:`reload` to re-read after a SIGHUP. Reads (``resolve``,
    ``is_alias``, …) are cheap and lock-free during steady state — they
    snapshot the current mapping reference; only the swap on reload is
    serialized.
    """

    def __init__(self, path: Path | str):
        self._path = Path(path)
        self._lock = threading.Lock()
        self._aliases: dict[str, Alias] = {}
        self._default: str | None = None
        self._load()

    @property
    def path(self) -> Path:
        return self._path

    def _load(self) -> None:
        """Initial load — propagates errors so a bad config fails fast at startup."""
        if not self._path.exists():
            raise AliasConfigError(f"alias config not found at {self._path}")
        with self._path.open("r", encoding="utf-8") as f:
            try:
                doc = yaml.safe_load(f)
            except yaml.YAMLError as e:
                raise AliasConfigError(f"failed to parse {self._path}: {e}") from e
        aliases, default = _parse_document(doc)
        # No lock needed during __init__ — nothing else can read yet.
        self._aliases = aliases
        self._default = default
        logger.info(
            "AliasRegistry loaded %d alias(es) from %s (default=%s)",
            len(aliases),
            self._path,
            default,
        )

    def reload(self) -> None:
        """Re-read the yaml file. On parse error, keep the previous state and raise.

        Designed for SIGHUP: callers should ``try/except AliasConfigError``
        and log; do not crash the service on a typo.
        """
        with self._path.open("r", encoding="utf-8") as f:
            try:
                doc = yaml.safe_load(f)
            except yaml.YAMLError as e:
                raise AliasConfigError(f"failed to parse {self._path}: {e}") from e
        aliases, default = _parse_document(doc)
        with self._lock:
            self._aliases = aliases
            self._default = default
        logger.info(
            "AliasRegistry reloaded %d alias(es) from %s (default=%s)",
            len(aliases),
            self._path,
            default,
        )

    @staticmethod
    def is_alias(name: str) -> bool:
        """Cheap syntactic check — does this name live in the alias namespace?

        Static; doesn't require a registry instance. Used by the router to
        decide whether to dispatch to the alias layer or pass through to
        provider-direct routing.
        """
        return isinstance(name, str) and name.startswith(ALIAS_PREFIX)

    def resolve(self, name: str) -> Alias:
        """Look up the named alias. Raises :class:`UnknownAliasError` if absent."""
        try:
            return self._aliases[name]
        except KeyError as e:
            raise UnknownAliasError(
                f"unknown alias {name!r} (known: {sorted(self._aliases)})"
            ) from e

    def resolve_chain(self, name: str) -> tuple[str, ...]:
        """Sugar for ``resolve(name).chain`` — the form the router actually wants."""
        return self.resolve(name).chain

    @property
    def default_alias(self) -> str | None:
        """The alias used when a request arrives with no recognizable model."""
        return self._default

    def list_aliases(self) -> list[Alias]:
        """All aliases as a snapshot list — for the GET /v1/aliases debug endpoint."""
        return [self._aliases[k] for k in sorted(self._aliases)]
