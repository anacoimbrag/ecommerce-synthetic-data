FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
COPY datasources ./datasources
ENV PORT=3000
ENV DATA_DIR=/app/datasources
EXPOSE 3000
CMD ["npm", "start"]
