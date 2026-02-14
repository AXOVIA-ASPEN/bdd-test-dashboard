FROM node:22-slim

RUN apt-get update && apt-get install -y \
    git \
    make \
    python3 \
    python3-pip \
    python3-venv \
    gcc \
    g++ \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --production

COPY . .

EXPOSE 8080

CMD ["node", "server.js"]
