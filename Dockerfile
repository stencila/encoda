# Build from local source and run tests
#   docker build --tag stencila/encoda .
#   docker run -it --rm stencila/encoda
#
# Or instead, the above is as a npm script:
#   npm test:docker

# Use `ubuntu`, rather than `node`, base image because that is what we generally
# use as a base and so this tests that all necessary deps are installed
FROM ubuntu:22.04

ARG DEBIAN_FRONTEND=noninteractive
ARG APT_KEY_DONT_WARN_ON_DANGEROUS_USAGE=1

# Install packages needed to install other packages
RUN apt-get update \
 && apt-get install -y \
        curl

# Install Node.js and npm. 
RUN curl -sL https://deb.nodesource.com/setup_14.x | bash - \
 && apt-get update \
 && apt-get install -y \
        nodejs \
 && apt-get autoremove -y \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

# Installs for getting Puppeteer 3+ on Ubuntu 20.04
#   Based on comments in https://github.com/puppeteer/puppeteer/issues/3443
# See the following for more, including recommended `docker run` args
#  https://github.com/puppeteer/puppeteer/blob/master/docs/troubleshooting.md#running-puppeteer-in-docker
#  https://github.com/puppeteer/puppeteer/issues/3451#issuecomment-523961368
RUN apt-get update \
 && apt-get install -y \
      libasound2 \
      libatk-bridge2.0-0 \
      libatk1.0-0 \
      libcups2 \
      libgbm1 \
      libgconf-2-4 \
      libgtk-3-0 \
      libgtk2.0-0 \
      libnotify-dev \
      libnss3 \
      libpangocairo-1.0-0 \
      libxcomposite1 \
      libxrandr2 \
      libxss1 \
      libxtst6 \
      xauth \
      xvfb \
 && apt-get autoremove -y \
 && apt-get clean \
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

# Copy over other files and run the necessary install scripts that
# we previously ignored.
COPY tsconfig*.json install.js ./
COPY --chown=encoda:encoda src ./src
RUN node install.js \
 && (cd node_modules/puppeteer && npm install) \
 && (cd node_modules/pa11y/node_modules/puppeteer && npm install)

# Run the tests
# The `max-old-space-size` option is to avoid running out of memory
# See error: https://dev.azure.com/stencila/stencila/_build/results?buildId=5098&view=logs&j=bdfe1ee2-0dfa-5214-b354-014a2d5aae2e&t=95f41a85-677a-5e68-afba-63ba0e2792c1&l=2090
CMD node --max-old-space-size=10240 ./node_modules/.bin/jest --maxWorkers=2 --testTimeout=900000 --forceExit
