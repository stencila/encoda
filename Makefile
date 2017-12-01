all: setup cover

setup:
	npm install

test:
	npm test
.PHONY: test

cover:
	npm run cover

clean:
	npm run clean
