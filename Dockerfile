FROM node:12

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies

# create package.json
RUN npm init -f

# Install app dependencies
RUN npm install cheerio@^1.0.0-rc.3 cookie-parser@~1.4.4 debug@~2.6.9 express@~4.16.1 morgan@~1.9.1 node-web-extractor@^0.0.3

# If you are building your code for production
RUN npm ci --only=production

# port
EXPOSE 3000

# run
CMD [ "node", "./node_modules/node-web-extractor/bin/www" ]
