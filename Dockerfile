#FROM node:11
FROM node

WORKDIR /usr/src/app

# Copy package.json to the WORKDIR
COPY package.json .

# Install the dependencies
RUN npm install

# Copy server.js, etc...
COPY . .

# Run the scripts command in the package.json
CMD ["npm", "start"]
