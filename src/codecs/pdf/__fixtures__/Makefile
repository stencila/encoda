external.pdf: external.txt
	convert xc:none -page A4 external.temp.pdf
	pdftk external.temp.pdf update_info external.txt output external.pdf
	rm external.temp.pdf
