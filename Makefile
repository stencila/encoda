all: lint format cover build docs

node_modules: package.json
	npm install --legacy-peer-deps

setup: node_modules

format: setup
	npm run format

lint: setup
	npm run lint

test: setup
	npm test

cover: setup
	npm run test:cover

check: setup
	npm run check

build: setup
	npm run build
.PHONY: build

docs: setup
	npm run docs
.PHONY: docs

clean: setup
	npm run clean
