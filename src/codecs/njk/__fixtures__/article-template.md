---
title: {{ title }}
---
{% for node in content %}
{% if node.type == 'Heading' %}
{{ node | dump('html') }}
{% else %}
{{ node.content }}
{% endif %}
{% else %}
This article is empty 😱
{% endfor %}
