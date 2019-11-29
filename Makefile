all: lint format cover build docs

setup:
	npm install

format:
	npm run format

lint:
	npm run lint

test:
	npm test

cover:
	npm run test:cover

check:
	npm run check

build:
	npm run build
.PHONY: build

docs:
	npm run docs
.PHONY: docs

clean:
	npm run clean
