all: setup lint cover check docs

setup:
	npm install

lint:
	npm run lint

test:
	npm test

cover:
	npm run cover

check:
	npm run check

build:
	npm run build

docs:
	npm run docs
.PHONY: docs

clean:
	npm run clean
