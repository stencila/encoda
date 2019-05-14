/**
 * These styles are primarily based on the output generated from
 * https://github.com/stencila/style This stringified stglesheet is inlined
 * into files being converted to HTML for better transportability and offline viewing
 * support.
 */
export const stencilaCSS = `@import url("https://fonts.googleapis.com/css?family=Nunito:400,400i,600,600i,700,700i,800,800i");

      button,
      input,
      textarea,
      select {
        -moz-appearance: none;
        -webkit-appearance: none;
        align-items: center;
        border: 1px solid transparent;
        border-radius: 4px;
        box-shadow: none;
        display: inline-flex;
        font-size: 1rem;
        height: 2.25em;
        justify-content: flex-start;
        line-height: 1.5;
        padding-bottom: calc(0.375em - 1px);
        padding-left: calc(0.625em - 1px);
        padding-right: calc(0.625em - 1px);
        padding-top: calc(0.375em - 1px);
        position: relative;
        vertical-align: top;
      }

      button:focus,
      input:focus,
      textarea:focus,
      select:focus,
      select.is-focused,
      button:active,
      input:active,
      textarea:active,
      select:active,
      select.is-active {
        outline: none;
      }

      button[disabled],
      input[disabled],
      textarea[disabled],
      select[disabled],
      fieldset[disabled] button,
      fieldset[disabled] input,
      fieldset[disabled] textarea,
      fieldset[disabled] select,
      select fieldset[disabled] select {
        cursor: not-allowed;
      }

      /*! minireset.css v0.0.4 | MIT License | github.com/jgthms/minireset.css */
      html,
      body,
      p,
      ol,
      ul,
      li,
      dl,
      dt,
      dd,
      blockquote,
      figure,
      fieldset,
      legend,
      textarea,
      pre,
      iframe,
      hr,
      h1,
      h2,
      h3,
      h4,
      h5,
      h6 {
        margin: 0;
        padding: 0;
      }

      h1,
      h2,
      h3,
      h4,
      h5,
      h6 {
        font-size: 100%;
        font-weight: normal;
      }

      ul {
        list-style: none;
      }

      button,
      input,
      select,
      textarea {
        margin: 0;
      }

      html {
        box-sizing: border-box;
      }

      *,
      *::before,
      *::after {
        box-sizing: inherit;
      }

      img,
      embed,
      iframe,
      object,
      video {
        height: auto;
        max-width: 100%;
      }

      audio {
        max-width: 100%;
      }

      iframe {
        border: 0;
      }

      table {
        border-collapse: collapse;
        border-spacing: 0;
      }

      td,
      th {
        padding: 0;
        text-align: left;
      }

      html {
        background-color: #ffffff;
        font-size: 16px;
        -moz-osx-font-smoothing: grayscale;
        -webkit-font-smoothing: antialiased;
        min-width: 300px;
        overflow-x: hidden;
        overflow-y: scroll;
        text-rendering: optimizeLegibility;
        -webkit-text-size-adjust: 100%;
        -moz-text-size-adjust: 100%;
        -ms-text-size-adjust: 100%;
        text-size-adjust: 100%;
      }

      article,
      aside,
      figure,
      footer,
      header,
      hgroup,
      section {
        display: block;
      }

      body,
      button,
      input,
      select,
      textarea {
        font-family: "Nunito", sans-serif;
      }

      code,
      pre {
        -moz-osx-font-smoothing: auto;
        -webkit-font-smoothing: auto;
        font-family: monospace;
      }

      body {
        color: #4a4a4a;
        font-size: 1rem;
        font-weight: 400;
        line-height: 1.5;
      }

      body {
        margin: 5rem auto;
        padding: 1rem;
        position: relative;
      }

      @media screen and (min-width: 1088px) {
        body {
          max-width: 960px;
          width: 960px;
        }
      }

      p,
      li {
        font-size: 1.125rem;
      }

      a,
      a:link {
        color: #2568ef;
        cursor: pointer;
        text-decoration: none;
      }

      a strong {
        color: currentColor;
      }

      a:hover {
        color: #363636;
      }

      code {
        background-color: whitesmoke;
        color: #ff3860;
        font-size: 0.875em;
        font-weight: normal;
        padding: 0.25em 0.5em 0.25em;
      }

      hr {
        background-color: whitesmoke;
        border: none;
        display: block;
        height: 2px;
        margin: 1.5rem 0;
      }

      img {
        height: auto;
        max-width: 100%;
      }

      input[type="checkbox"],
      input[type="radio"] {
        vertical-align: baseline;
      }

      small {
        font-size: 0.875em;
      }

      span {
        font-style: inherit;
        font-weight: inherit;
      }

      strong {
        color: #363636;
        font-weight: 700;
      }

      fieldset {
        border: none;
      }

      pre {
        -webkit-overflow-scrolling: touch;
        background-color: whitesmoke;
        color: #4a4a4a;
        font-size: 0.875em;
        overflow-x: auto;
        padding: 1.25rem 1.5rem;
        white-space: pre;
        word-wrap: normal;
      }

      pre code {
        background-color: transparent;
        color: currentColor;
        font-size: 1em;
        padding: 0;
      }

      table td,
      table th {
        text-align: left;
        vertical-align: top;
      }

      table th {
        color: #363636;
      }

      button {
        background-color: #ffffff;
        border-color: #dbdbdb;
        border-width: 2px;
        border-radius: 50%;
        color: #363636;
        cursor: pointer;
        justify-content: center;
        padding-bottom: calc(0.375em - 2px);
        padding-left: 0.75em;
        padding-right: 0.75em;
        padding-top: calc(0.375em - 2px);
        text-align: center;
        white-space: nowrap;
      }

      button strong {
        color: inherit;
      }

      button:hover {
        border-color: #b5b5b5;
        color: #363636;
      }

      button:focus {
        border-color: #3273dc;
        color: #363636;
      }

      button:focus:not(:active) {
        box-shadow: 0 0 0 0.125em rgba(37, 104, 239, 0.25);
      }

      button:active {
        border-color: #4a4a4a;
        color: #363636;
      }

      button[disabled],
      fieldset[disabled] button {
        background-color: #ffffff;
        border-color: #dbdbdb;
        box-shadow: none;
        opacity: 0.5;
      }

      li+li {
        margin-top: 0.25em;
      }

      p:not(:last-child),
      dl:not(:last-child),
      ol:not(:last-child),
      ul:not(:last-child),
      blockquote:not(:last-child),
      pre:not(:last-child),
      table:not(:last-child) {
        margin-bottom: 1em;
      }

      h1,
      h2,
      h3,
      h4,
      h5,
      h6 {
        font-weight: 700;
        line-height: 1.125;
      }

      h1:not(:first-child),
      h2:not(:first-child),
      h3:not(:first-child),
      h4:not(:first-child),
      h5:not(:first-child),
      h6:not(:first-child) {
        margin-top: 4.5rem;
      }

      h1,
      h2,
      h3 {
        color: #1d63f3;
      }

      h1 {
        font-size: 2em;
        line-height: 1.16667em;
        margin-bottom: 4.375rem;
        /* margin-bottom: 2.25rem; */
        position: relative;
        text-align: center;
        text-transform: none;
      }

      h1:after {
        position: absolute;
        content: '';
        display: block;
        bottom: -2rem;
        left: 50%;
        height: 3px;
        width: 3.75rem;
        background: #66ff66;
        transform: translateX(-50%);
      }

      h2 {
        border-bottom: 4px solid #5eff5d;
        font-size: 1.75rem;
        margin-bottom: .5em;
        padding-bottom: 0.375em;
      }

      h3 {
        font-size: 1.75rem;
        font-weight: normal;
        margin-bottom: 0.5em;
      }

      h4 {
        color: #7a7a7a;
        font-size: 1.5rem;
        margin-bottom: 0.5em;
      }

      h5 {
        color: #7a7a7a;
        font-size: 1rem;
        font-weight: 800;
        letter-spacing: 2px;
        margin-bottom: 0.5em;
        text-transform: uppercase;
      }

      h6 {
        font-weight: normal;
        padding-bottom: 0.5em;
        color: #7a7a7a;
        font-size: 1.25rem;
        margin-bottom: .5em;
        border-bottom: 1px solid #b5b5b5;
      }

      h1+h2 {
        margin-top: -1.25rem;
      }

      h1+h2 {
        color: #4a4a4a;
        font-size: 1.25rem;
        font-weight: 400;
        line-height: 1.25;
      }

      h2+h1 {
        margin-top: -1.25rem;
      }

      blockquote {
        background-color: #f1f1f2;
        border-left: 5px solid #2568ef;
        padding: 1.25em 1.5em;
      }

      ol {
        list-style-position: outside;
        margin-left: 2em;
        margin-top: 1em;
      }

      ul {
        list-style: disc outside;
        margin-left: 2em;
        margin-top: 1em;
      }

      ul ul {
        list-style-type: circle;
        margin-top: 0.5em;
      }

      ul ul ul {
        list-style-type: square;
      }

      dd {
        margin-left: 2em;
      }

      figure {
        margin-left: 2em;
        margin-right: 2em;
        text-align: center;
      }

      figure:not(:first-child) {
        margin-top: 2em;
      }

      figure:not(:last-child) {
        margin-bottom: 2em;
      }

      figure img {
        display: inline-block;
      }

      figure figcaption {
        font-style: italic;
      }

      sup,
      sub {
        font-size: 75%;
      }

      table {
        width: 100%;
      }

      table td,
      table th {
        border: 1px solid #dbdbdb;
        border-width: 0 0 1px;
        padding: 0.5em 0.75em;
        vertical-align: top;
      }

      table th {
        color: #363636;
        text-align: left;
      }

      table thead td,
      table thead th {
        border-width: 0 0 2px;
        color: #363636;
        font-weight: bold;
        text-transform: uppercase;
        font-size: 0.8rem;
        letter-spacing: 1px;
      }

      table tfoot td,
      table tfoot th {
        border-width: 2px 0 0;
        color: #363636;
      }

      table ttr:last-child td,
      table ttr:last-child th {
        border-bottom-width: 0;
      }

      input,
      textarea {
        background-color: #ffffff;
        border-color: #dbdbdb;
        color: #363636;
        box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
        max-width: 100%;
        width: 100%;
      }

      input::-moz-placeholder,
      textarea::-moz-placeholder {
        color: rgba(54, 54, 54, 0.3);
      }

      input::-webkit-input-placeholder,
      textarea::-webkit-input-placeholder {
        color: rgba(54, 54, 54, 0.3);
      }

      input:-moz-placeholder,
      textarea:-moz-placeholder {
        color: rgba(54, 54, 54, 0.3);
      }

      input:-ms-input-placeholder,
      textarea:-ms-input-placeholder {
        color: rgba(54, 54, 54, 0.3);
      }

      input:hover,
      textarea:hover {
        border-color: #b5b5b5;
      }

      input:focus,
      input:active,
      textarea:focus,
      textarea:active {
        border-color: #2568ef;
        box-shadow: 0 0 0 0.125em rgba(37, 104, 239, 0.25);
      }

      input[disabled],
      fieldset[disabled] input,
      textarea[disabled],
      fieldset[disabled] textarea {
        background-color: whitesmoke;
        border-color: whitesmoke;
        box-shadow: none;
        color: #7a7a7a;
      }

      input[disabled]::-moz-placeholder,
      fieldset[disabled] input::-moz-placeholder,
      textarea[disabled]::-moz-placeholder,
      fieldset[disabled] textarea::-moz-placeholder {
        color: rgba(122, 122, 122, 0.3);
      }

      input[disabled]::-webkit-input-placeholder,
      fieldset[disabled] input::-webkit-input-placeholder,
      textarea[disabled]::-webkit-input-placeholder,
      fieldset[disabled] textarea::-webkit-input-placeholder {
        color: rgba(122, 122, 122, 0.3);
      }

      input[disabled]:-moz-placeholder,
      fieldset[disabled] input:-moz-placeholder,
      textarea[disabled]:-moz-placeholder,
      fieldset[disabled] textarea:-moz-placeholder {
        color: rgba(122, 122, 122, 0.3);
      }

      input[disabled]:-ms-input-placeholder,
      fieldset[disabled] input:-ms-input-placeholder,
      textarea[disabled]:-ms-input-placeholder,
      fieldset[disabled] textarea:-ms-input-placeholder {
        color: rgba(122, 122, 122, 0.3);
      }

      input[readonly],
      textarea[readonly] {
        box-shadow: none;
      }

      textarea {
        display: block;
        max-width: 100%;
        min-width: 100%;
        padding: 0.625em;
        resize: vertical;
      }

      textarea:not([rows]) {
        max-height: 600px;
        min-height: 120px;
      }

      textarea[rows] {
        height: initial;
      }

      input[type="checkbox"],
      input[type="radio"] {
        cursor: pointer;
        display: inline-block;
        line-height: 1.25;
        position: relative;
      }

      input[type="checkbox"] input,
      input[type="radio"] input {
        cursor: pointer;
      }

      input[type="checkbox"]:hover,
      input[type="radio"]:hover {
        color: #363636;
      }

      input[type="checkbox"][disabled],
      fieldset[disabled] input[type="checkbox"],
      input[type="radio"][disabled],
      fieldset[disabled] input[type="radio"] {
        color: #7a7a7a;
        cursor: not-allowed;
      }

      input[type="radio"]+input[type="radio"] {
        margin-left: 0.5em;
      }

      select {
        display: inline-block;
        max-width: 100%;
        position: relative;
        vertical-align: top;
      }

      select:not(.is-multiple) {
        height: 2.25em;
      }

      select::after {
        border-color: #2568ef;
        right: 1.125em;
        z-index: 4;
      }

      select {
        background-color: #ffffff;
        border-color: #dbdbdb;
        color: #363636;
        cursor: pointer;
        display: block;
        font-size: 1em;
        max-width: 100%;
        outline: none;
      }

      select::-moz-placeholder {
        color: rgba(54, 54, 54, 0.3);
      }

      select::-webkit-input-placeholder {
        color: rgba(54, 54, 54, 0.3);
      }

      select:-moz-placeholder {
        color: rgba(54, 54, 54, 0.3);
      }

      select:-ms-input-placeholder {
        color: rgba(54, 54, 54, 0.3);
      }

      select:hover {
        border-color: #b5b5b5;
      }

      select:focus,
      select:active {
        border-color: #2568ef;
        box-shadow: 0 0 0 0.125em rgba(37, 104, 239, 0.25);
      }

      select[disabled],
      fieldset[disabled] select {
        background-color: whitesmoke;
        border-color: whitesmoke;
        box-shadow: none;
        color: #7a7a7a;
      }

      select[disabled]::-moz-placeholder,
      fieldset[disabled] select::-moz-placeholder {
        color: rgba(122, 122, 122, 0.3);
      }

      select[disabled]::-webkit-input-placeholder,
      fieldset[disabled] select::-webkit-input-placeholder {
        color: rgba(122, 122, 122, 0.3);
      }

      select[disabled]:-moz-placeholder,
      fieldset[disabled] select:-moz-placeholder {
        color: rgba(122, 122, 122, 0.3);
      }

      select[disabled]:-ms-input-placeholder,
      fieldset[disabled] select:-ms-input-placeholder {
        color: rgba(122, 122, 122, 0.3);
      }

      select::-ms-expand {
        display: none;
      }

      select[disabled]:hover,
      fieldset[disabled] select:hover {
        border-color: whitesmoke;
      }

      select:not([multiple]) {
        padding-right: 2.5em;
      }

      select[multiple] {
        height: auto;
        padding: 0;
      }

      select[multiple] option {
        padding: 0.5em 1em;
      }

      select:hover::after {
        border-color: #363636;
      }

      label {
        color: #363636;
        display: block;
        font-size: 1rem;
        font-weight: 700;
      }

      label:not(:last-child) {
        margin-bottom: 0.5em;
      }

      img {
        display: inline-block;
        height: auto;
        max-width: 100%;
        position: relative;
        vertical-align: middle;
        width: auto;
      }

      img+img,
      img+a>img,
      a+a>img {
        margin: 1rem auto;
      }

      a {
        display: inline-block;
      }

      table {
        background-color: #ffffff;
        color: #363636;
      }

      table td,
      table th {
        border: 1px solid #dbdbdb;
        border-width: 0 0 1px;
        padding: 0.5em 0.75em;
        vertical-align: top;
      }

      table th {
        color: #363636;
        text-align: left;
      }

      table tr td,
      table tr th {
        color: currentColor;
      }

      table thead {
        background-color: transparent;
      }

      table thead td,
      table thead th {
        border-width: 0 0 2px;
        color: #363636;
      }

      table tfoot {
        background-color: transparent;
      }

      table tfoot td,
      table tfoot th {
        border-width: 2px 0 0;
        color: #363636;
      }

      table tbody {
        background-color: transparent;
      }

      table tr:last-child td,
      table tr:last-child th {
        border-bottom-width: 0;
      }

      table td,
      table th {
        border-width: 1px;
      }

      table tr:last-child td,
      table tr:last-child th {
        border-bottom-width: 1px;
      }

      table tr:hover {
        background-color: #fafafa;
      }

      table tr:hover:nth-child(even) {
        background-color: whitesmoke;
      }

      video {
        position: relative;
        padding-bottom: 56.25%;
        padding-top: 0;
        height: 0;
        margin-top: 5rem;
        margin-bottom: 5rem;
        -webkit-backface-visibility: visible;
        backface-visibility: visible;
      }

      video:after {
        position: absolute;
        width: 100%;
        height: 100%;
        left: 1.375rem;
        top: 1.375rem;
        content: '';
        background: rgba(0, 0, 0, 0.1);
        display: block;
        z-index: 0;
      }

      video iframe {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1;
        background: #f1f1f2;
      }`
