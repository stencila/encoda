# Makefile for fetching XSLT stylesheets
# This may need to be rerun when those stylesheets become updated

# "Yarosh" stylesheets from https://github.com/oerpub/mathconverter
# Not used as they appear to be un-maintained
mml-tex-yarosh:
	rm -rf mml-tex
	curl -sLO https://github.com/oerpub/mathconverter/archive/master.zip
	unzip -o master.zip
	mkdir mml-tex
	cp mathconverter-master/xsl_yarosh/* mml-tex/
	rm -rf mathconverter-master master.zip

# Transpect stylesheets from https://github.com/transpect/mml2tex
# These are more recently maintained but when attempting to use
# them with `xsltproc` I got manu errors like
#   XPath error : Forbidden variable
#   XPath error : Invalid predicate
#   XPath error : Invalid expression
mml-tex-transpect:
	rm -rf mml-tex
	curl -sLO https://github.com/transpect/mml2tex/archive/master.zip
	unzip -o master.zip
	mkdir mml-tex
	mv mml2tex-master/xsl mml-tex
	mv mml2tex-master/LICENSE mml-tex
	rm -rf mml2tex-master master.zip
