"""Tests for the model-alias registry."""

from __future__ import annotations

from pathlib import Path

import pytest

from src.aliases import (
    ALIAS_PREFIX,
    Alias,
    AliasConfigError,
    AliasRegistry,
    UnknownAliasError,
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def write_yaml(tmp_path: Path, body: str, name: str = "aliases.yaml") -> Path:
    p = tmp_path / name
    p.write_text(body, encoding="utf-8")
    return p


VALID_CONFIG = """\
aliases:
  mana/fast-text:
    description: "fast"
    chain:
      - ollama/qwen2.5:7b
      - groq/llama-3.1-8b-instant
  mana/long-form:
    description: "long"
    chain:
      - ollama/gemma3:12b
      - groq/llama-3.3-70b-versatile
default: mana/fast-text
"""


# ---------------------------------------------------------------------------
# Construction & happy-path resolution
# ---------------------------------------------------------------------------


class TestRegistryHappyPath:
    def test_loads_valid_yaml(self, tmp_path: Path) -> None:
        path = write_yaml(tmp_path, VALID_CONFIG)
        reg = AliasRegistry(path)
        assert reg.path == path
        assert reg.default_alias == "mana/fast-text"

    def test_resolve_returns_alias_dataclass(self, tmp_path: Path) -> None:
        reg = AliasRegistry(write_yaml(tmp_path, VALID_CONFIG))
        alias = reg.resolve("mana/long-form")
        assert isinstance(alias, Alias)
        assert alias.name == "mana/long-form"
        assert alias.description == "long"
        assert alias.chain == ("ollama/gemma3:12b", "groq/llama-3.3-70b-versatile")

    def test_resolve_chain_returns_tuple(self, tmp_path: Path) -> None:
        reg = AliasRegistry(write_yaml(tmp_path, VALID_CONFIG))
        chain = reg.resolve_chain("mana/fast-text")
        assert chain == ("ollama/qwen2.5:7b", "groq/llama-3.1-8b-instant")
        # Tuples ensure callers can't mutate the registry's internal state.
        assert isinstance(chain, tuple)

    def test_list_aliases_sorted(self, tmp_path: Path) -> None:
        reg = AliasRegistry(write_yaml(tmp_path, VALID_CONFIG))
        names = [a.name for a in reg.list_aliases()]
        assert names == sorted(names)
        assert names == ["mana/fast-text", "mana/long-form"]

    def test_unknown_alias_raises(self, tmp_path: Path) -> None:
        reg = AliasRegistry(write_yaml(tmp_path, VALID_CONFIG))
        with pytest.raises(UnknownAliasError, match="mana/nope"):
            reg.resolve("mana/nope")

    def test_default_optional(self, tmp_path: Path) -> None:
        body = (
            "aliases:\n"
            "  mana/x:\n"
            '    description: "x"\n'
            "    chain:\n"
            "      - ollama/foo:1b\n"
        )
        reg = AliasRegistry(write_yaml(tmp_path, body))
        assert reg.default_alias is None


class TestIsAlias:
    """``is_alias`` is a cheap static syntactic check used by the router."""

    @pytest.mark.parametrize(
        "name",
        ["mana/fast-text", "mana/anything", f"{ALIAS_PREFIX}foo"],
    )
    def test_recognises_alias_namespace(self, name: str) -> None:
        assert AliasRegistry.is_alias(name) is True

    @pytest.mark.parametrize(
        "name",
        ["ollama/gemma3:4b", "groq/llama", "gemma3:4b", "", "mana", "manaX/foo"],
    )
    def test_rejects_non_alias(self, name: str) -> None:
        assert AliasRegistry.is_alias(name) is False

    def test_static_no_instance_needed(self) -> None:
        # Important: callers can hit this without instantiating, so it must
        # be a free function or @staticmethod.
        assert AliasRegistry.is_alias("mana/x") is True


# ---------------------------------------------------------------------------
# Schema validation — the YAML is user-edited, must fail loudly on typos
# ---------------------------------------------------------------------------


class TestSchemaValidation:
    def test_missing_file_raises(self, tmp_path: Path) -> None:
        with pytest.raises(AliasConfigError, match="not found"):
            AliasRegistry(tmp_path / "absent.yaml")

    def test_invalid_yaml_raises(self, tmp_path: Path) -> None:
        path = write_yaml(tmp_path, "aliases: [\n  unclosed")
        with pytest.raises(AliasConfigError, match="failed to parse"):
            AliasRegistry(path)

    def test_root_not_a_mapping(self, tmp_path: Path) -> None:
        path = write_yaml(tmp_path, "- just-a-list\n")
        with pytest.raises(AliasConfigError, match="root must be a mapping"):
            AliasRegistry(path)

    def test_aliases_must_be_mapping(self, tmp_path: Path) -> None:
        path = write_yaml(tmp_path, "aliases: just-a-string\n")
        with pytest.raises(AliasConfigError, match="`aliases` must be a mapping"):
            AliasRegistry(path)

    def test_empty_aliases_rejected(self, tmp_path: Path) -> None:
        path = write_yaml(tmp_path, "aliases: {}\n")
        with pytest.raises(AliasConfigError, match="empty"):
            AliasRegistry(path)

    def test_alias_name_must_use_mana_namespace(self, tmp_path: Path) -> None:
        body = (
            "aliases:\n"
            "  fast-text:\n"
            '    description: "x"\n'
            "    chain:\n"
            "      - ollama/foo:1b\n"
        )
        path = write_yaml(tmp_path, body)
        with pytest.raises(AliasConfigError, match="mana/"):
            AliasRegistry(path)

    def test_alias_name_must_have_one_segment(self, tmp_path: Path) -> None:
        body = (
            "aliases:\n"
            "  mana/foo/bar:\n"
            '    description: "x"\n'
            "    chain:\n"
            "      - ollama/foo:1b\n"
        )
        path = write_yaml(tmp_path, body)
        with pytest.raises(AliasConfigError, match="exactly one segment"):
            AliasRegistry(path)

    def test_chain_must_be_list(self, tmp_path: Path) -> None:
        body = (
            "aliases:\n"
            "  mana/x:\n"
            '    description: "x"\n'
            '    chain: "ollama/gemma3:4b"\n'
        )
        path = write_yaml(tmp_path, body)
        with pytest.raises(AliasConfigError, match="chain must be a list"):
            AliasRegistry(path)

    def test_empty_chain_rejected(self, tmp_path: Path) -> None:
        body = "aliases:\n  mana/x:\n    chain: []\n"
        path = write_yaml(tmp_path, body)
        with pytest.raises(AliasConfigError, match="must not be empty"):
            AliasRegistry(path)

    def test_chain_entry_without_provider_prefix_rejected(self, tmp_path: Path) -> None:
        # "gemma3:4b" without a provider/ prefix would silently default to
        # ollama and confuse the health-cache; reject loudly at config-load.
        body = "aliases:\n  mana/x:\n    chain:\n      - gemma3:4b\n"
        path = write_yaml(tmp_path, body)
        with pytest.raises(AliasConfigError, match="provider prefix"):
            AliasRegistry(path)

    def test_chain_entry_must_be_string(self, tmp_path: Path) -> None:
        body = "aliases:\n  mana/x:\n    chain:\n      - 42\n"
        path = write_yaml(tmp_path, body)
        with pytest.raises(AliasConfigError):
            AliasRegistry(path)

    def test_default_must_reference_known_alias(self, tmp_path: Path) -> None:
        body = (
            "aliases:\n"
            "  mana/x:\n"
            '    description: "x"\n'
            "    chain:\n"
            "      - ollama/foo:1b\n"
            "default: mana/missing\n"
        )
        path = write_yaml(tmp_path, body)
        with pytest.raises(AliasConfigError, match="references unknown alias"):
            AliasRegistry(path)


# ---------------------------------------------------------------------------
# Reload semantics — SIGHUP should be safe even with typos
# ---------------------------------------------------------------------------


class TestReload:
    def test_reload_picks_up_edits(self, tmp_path: Path) -> None:
        path = write_yaml(tmp_path, VALID_CONFIG)
        reg = AliasRegistry(path)
        assert reg.resolve_chain("mana/long-form") == (
            "ollama/gemma3:12b",
            "groq/llama-3.3-70b-versatile",
        )

        # Edit on disk: shrink the long-form chain.
        new_body = (
            "aliases:\n"
            "  mana/long-form:\n"
            '    description: "shorter"\n'
            "    chain:\n"
            "      - groq/llama-3.3-70b-versatile\n"
            "default: mana/long-form\n"
        )
        path.write_text(new_body, encoding="utf-8")
        reg.reload()

        assert reg.resolve_chain("mana/long-form") == ("groq/llama-3.3-70b-versatile",)
        assert reg.default_alias == "mana/long-form"
        # Aliases that disappeared from the new file are gone.
        with pytest.raises(UnknownAliasError):
            reg.resolve("mana/fast-text")

    def test_reload_keeps_old_state_on_parse_error(self, tmp_path: Path) -> None:
        path = write_yaml(tmp_path, VALID_CONFIG)
        reg = AliasRegistry(path)
        # First reload fine — establish a baseline.
        reg.reload()

        # Now break the file with an obviously invalid yaml.
        path.write_text("aliases: [unclosed\n", encoding="utf-8")
        with pytest.raises(AliasConfigError):
            reg.reload()

        # The previous good state must still be queryable — service stays up.
        assert reg.resolve_chain("mana/fast-text") == (
            "ollama/qwen2.5:7b",
            "groq/llama-3.1-8b-instant",
        )
        assert reg.default_alias == "mana/fast-text"

    def test_reload_keeps_old_state_on_schema_error(self, tmp_path: Path) -> None:
        path = write_yaml(tmp_path, VALID_CONFIG)
        reg = AliasRegistry(path)

        # Empty aliases — would be rejected on first load, must also be
        # rejected here without nuking the in-memory state.
        path.write_text("aliases: {}\n", encoding="utf-8")
        with pytest.raises(AliasConfigError):
            reg.reload()

        assert "mana/fast-text" in [a.name for a in reg.list_aliases()]


# ---------------------------------------------------------------------------
# Repo-shipped aliases.yaml is itself valid
# ---------------------------------------------------------------------------


class TestShippedConfig:
    def test_repo_aliases_yaml_loads(self) -> None:
        # The yaml file checked into services/mana-llm/aliases.yaml is the
        # one that runs in production. It must always parse cleanly — this
        # test catches editor accidents before they ship.
        repo_yaml = Path(__file__).resolve().parents[1] / "aliases.yaml"
        assert repo_yaml.exists(), f"shipped config missing at {repo_yaml}"
        reg = AliasRegistry(repo_yaml)
        # Sanity: the five classes the plan calls out must exist.
        for expected in (
            "mana/fast-text",
            "mana/long-form",
            "mana/structured",
            "mana/reasoning",
            "mana/vision",
        ):
            reg.resolve(expected)
