# Build from local source
#   docker build --tag stencila/convert .
# Run tests
#   docker run stencila/convert
# Or to test out interactively at the terminal
#   docker run -it stencila/convert bash

FROM node

RUN mkdir -p /opt/stecila-convert
WORKDIR /opt/stecila-convert

# Separate copy and Docker layer for `package.json` to prevent
# unecessary reinstall of `node_modules` when `src` changes
COPY package.json package.json
RUN npm install

# Copy over everything else
COPY . .

# Run as guest user
RUN useradd --create-home --home-dir /home/guest guest
RUN chown -R guest /opt/stecila-convert
USER guest

# Get Pandoc as the guest user so it's in correct homedir
RUN npm run setup

CMD npm run test
