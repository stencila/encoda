# Nunjucks codec

The `dump` filter allows users to dump a node e.g. using the current, top-level format:

    {{ content | dump }}

Specifying another format e.g. JSON within HTML:

    {{ authors | dump('json') }}

Setting a encode option (wow, so recursive!):

    {{ authors | dump('html', template = 'authors.html') }}

Note that the arguments of this filter, mirror those
of the `dump` function. If the `format` parameter
defaults to the rendering environment's global `format`
variable. The `options` parameter collects any named
arguments that the user specifies (i.e. it's like Python's `**kwargs`).
