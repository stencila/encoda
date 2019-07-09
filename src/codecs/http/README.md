# `http`: HTTP codec

The `http` codec is able to decode a HTTP URL (a URL starting with `http` or `https`). It is a 'meta' codec in that it uses the media type of the response content, as specified in the `Content-Type` header, to delegate the decoding of content to other codecs. It also maintains a cache of responses, which respects the `Cache-Control` header, to improve performance and reduce bandwidth consumption.

For example if you request the CSV file on the leading causes of death in the United States from the Centre for Disease Control using `curl` you will see that the response contains several headers, including `Content-Type` and `Cache-Control`:

```bash
$ curl -is https://data.cdc.gov/api/views/bi63-dtpu/rows.csv

HTTP/1.1 200 OK
...
Content-Type: text/csv; charset=utf-8
...
Cache-Control: public, must-revalidate, max-age=21600
...
```

When you use the `convert` command with an input that matches the `http` codec it will transparently work out how to decode and cache the data using those header. For example, to fetch the CDC data and convert it to an Excel file.

```bash
encoda convert https://data.cdc.gov/api/views/bi63-dtpu/rows.csv deaths.xslx
```

The `http` codec is often used to `include` or `import` data from an external source. It is a better alternative to downloading the data and importing from a local file when you want the data to be up-to-date each time the dccument is executed.
