FROM python:3.11-slim

WORKDIR /app

# Use Aliyun mirrors for China
RUN sed -i 's/deb.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list.d/debian.sources 2>/dev/null; \
    sed -i 's/deb.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list 2>/dev/null; \
    sed -i 's/httpredir.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list 2>/dev/null; \
    :

# Install system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps (Aliyun pip mirror)
COPY requirements.txt .
RUN pip install --no-cache-dir -i https://mirrors.aliyun.com/pypi/simple/ --trusted-host mirrors.aliyun.com -r requirements.txt

# Copy app
COPY . .

# Copy APK for app update download endpoint
COPY ../downloads /opt/tarot-app/downloads

# Set APK path for app_update router
ENV APK_FILE_PATH=/opt/tarot-app/downloads/tarot-app.apk

# Expose port
EXPOSE 8188

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -sf http://localhost:8188/api/health || exit 1

# Start
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8188"]
