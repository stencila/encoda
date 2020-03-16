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

FROM node:12

# Installs for getting Puppeteer to run in Docker
# See the following for more, including recommended `docker run` args
#  https://github.com/puppeteer/puppeteer/blob/master/docs/troubleshooting.md#running-puppeteer-in-docker
#  https://github.com/puppeteer/puppeteer/issues/3451#issuecomment-523961368

# Install necessary libs to make the bundled version of Chromium that Puppeteer installs, work.
# From https://github.com/puppeteer/puppeteer/blob/master/docs/troubleshooting.md#running-puppeteer-in-docker
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-unstable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Enable user namespace cloning so that Chromium can create a sandbox
RUN echo 'kernel.unprivileged_userns_clone=1' > /etc/sysctl.d/userns.conf

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

# Copy over other file and run the necessary install scripts that
# we previously ignored.
COPY tsconfig.json install.js ./
COPY --chown=encoda:encoda src ./src
RUN node install.js \
 && (cd node_modules/puppeteer && npm install) \
 && (cd node_modules/pa11y/node_modules/puppeteer && npm install)

# Run the tests
CMD DOCKER=true npm test -- --testTimeout=120000 --forceExit
