FROM python:3.12-alpine

WORKDIR /app

COPY main.py .

# No dependencies needed - uses only stdlib
RUN chmod +x main.py

EXPOSE 8080

ENV PORT=8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:8080/health || exit 1

CMD ["python", "main.py"]
