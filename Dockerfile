# Build from local source and run tests
#   docker build --tag stencila/encoda .
#   docker run -it --init --rm --cap-add=SYS_ADMIN stencila/encoda

# Or instead, the above is as a npm script:
#   npm test:docker
#
# To test out interactively at the terminal
#   docker run -it --init --rm --cap-add=SYS_ADMIN stencila/encoda bash
#
# The `--init` and `--cap-add` options to `run` are necessary for running Puppeteer
# (see below).

FROM node:14

# Installs for getting Puppeteer to run in Docker
# See the following for more, including recommended `docker run` args
#  https://github.com/puppeteer/puppeteer/blob/master/docs/troubleshooting.md#running-puppeteer-in-docker
#  https://github.com/puppeteer/puppeteer/issues/3451#issuecomment-523961368

# Install necessary libs to make the bundled version of Chromium that Puppeteer installs, work.
# From https://github.com/puppeteer/puppeteer/blob/master/docs/troubleshooting.md#running-puppeteer-in-docker
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Install and run as non-root user, because it is generally good practice,
# and in this case necessary to be able to run Chromium without the
# unsafe `--no-sandbox` option.
RUN useradd --create-home encoda
WORKDIR /home/encoda
USER encoda

# Copy package.json and package-lock.json and install
# In a separate layer to avoid long reinstall everytime an unrelated files changes
# Use `--ignore-scripts` option otherwise our own `install.js` script will fail
COPY package*.json ./
RUN npm install --ignore-scripts
RUN npx patch-package

# Copy over other file and run the necessary install scripts that
# we previously ignored.
COPY tsconfig*.json install.js ./
COPY --chown=encoda:encoda src ./src
RUN node install.js \
 && (cd node_modules/puppeteer && npm install) \
 && (cd node_modules/pa11y/node_modules/puppeteer && npm install)

# Run the tests
# The `max-old-space-size` option is to avoid running out of memory
# See error: https://dev.azure.com/stencila/stencila/_build/results?buildId=5098&view=logs&j=bdfe1ee2-0dfa-5214-b354-014a2d5aae2e&t=95f41a85-677a-5e68-afba-63ba0e2792c1&l=2090
CMD node --max-old-space-size=10240 ./node_modules/.bin/jest --testTimeout=120000 --forceExit
