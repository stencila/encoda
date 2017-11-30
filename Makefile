# A simple Makefile providing shortcuts to NPM tasks defined in package.json
# Why? Because, for developers working in multiple Stencila repos, using alternative
# languages (e.g. Javascript, R, Python), it's nice to have a consistent command line
# interface for common development tasks (e.g. `make setup`, `make run`, `make docs`)

all: setup cover build

setup:
	npm install

test:
	npm test

test-browser:
	npm run test-browser

cover:
	npm run cover

build:
	npm run build
.PHONY: build

clean:
	rm -rf node_modules build tmp
