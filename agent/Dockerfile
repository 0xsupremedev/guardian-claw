FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json ./
RUN npm install --production

# Copy agent code
COPY . .

# Create logs directory
RUN mkdir -p logs

EXPOSE 9001

CMD ["node", "agent.js"]
