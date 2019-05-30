# Build from local source
#   docker build --tag stencila/encoda .
# Run tests
#   docker run stencila/encoda
# Or to test out interactively at the terminal
#   docker run -it stencila/encoda bash

FROM node

RUN mkdir -p /opt/encoda
WORKDIR /opt/encoda

# Separate copy and Docker layer for `package.json` to prevent
# unecessary reinstall of `node_modules` when `src` changes
COPY package.json package.json
RUN npm install

# Copy over everything else
COPY . .

# Run as guest user
RUN useradd --create-home --home-dir /home/guest guest
RUN chown -R guest /opt/encoda
USER guest

CMD npm test
