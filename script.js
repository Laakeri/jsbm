function solve(S, mod) {
	var C = [bigInt(1)];
	var B = [bigInt(1)];
	var b = bigInt(1);
	var L = 0;
	var m = 1;
	var N = S.length;
	for (var i = 0; i < N; i++) {
		var d = S[i];
		for (var j = 1; j <= L; j++) {
			d = d.add(C[j].multiply(S[i - j]));
			d = d.mod(mod);
		}
		if (d.isZero()) {
			m++
		} else if (2*L <= i) {
			var T = C.slice(0);
			var a = b.modInv(mod).multiply(d).mod(mod);
			for (var j = 0; j < i+1-2*L; j++) {
				C.push(bigInt(0));
			}
			L = i+1-L;
			for (var j = m; j <= L; j++) {
				C[j] = C[j].minus(a.multiply(B[j - m]));
				C[j] = C[j].mod(mod);
				if (C[j].isNegative()) C[j] = C[j].add(mod);
			}
			B = T.slice(0);
			b = d;
			m = 1;
		} else {
			var a = b.modInv(mod).multiply(d).mod(mod);
			for (var j = m; j < m + B.length; j++) {
				C[j] = C[j].minus(a.multiply(B[j - m]));
				C[j] = C[j].mod(mod);
				if (C[j].isNegative()) C[j] = C[j].add(mod);
			}
			m++;
		}
	}
	return C;
}

function getModCoefficients(S, mod) {
	var C = solve(S, mod);
	var ret = [];
	for (var i = 1; i < C.length; i++) {
		ret.push(mod.minus(C[i]).mod(mod));
	}
	return ret;
}

function tryIntCoeffMod(S, mod) {
	var modInts = [];
	for (var i = 0; i < S.length; i++) {
		modInts.push(S[i]);
		modInts[i] = modInts[i].mod(mod);
		modInts[i] = modInts[i].add(mod);
		modInts[i] = modInts[i].mod(mod);
	}
	var C = getModCoefficients(modInts, mod);
	for (var i = 0; i < C.length; i++) {
		if (mod.lesser(C[i].add(C[i]))) {
			C[i] = C[i].minus(mod);
		}
	}
	for (var i = C.length; i < S.length; i++) {
		var val = bigInt(0);
		for (var j = 0; j < C.length; j++) {
			val = val.add(C[j].multiply(S[i-j-1]));
		}
		if (val.notEquals(S[i])) {
			return [];
		}
	}
	return C;
}

function getIntCoefficients(S) {
	var maxA = bigInt(2);
	for (var i = 0; i < S.length; i++) {
		maxA = bigInt.max(maxA, S[i].abs());
	}
	var modCand = maxA.multiply(bigInt(2));
	var iters = Math.max(50, S.length);
	var it = 0;
	while (it < iters) {
		if (modCand.isProbablePrime(100)) {
			var C = tryIntCoeffMod(S, modCand);
			if (C.length > 0) {
				return C;
			}
			it++;
			modCand = modCand.multiply(bigInt(2));
		}
		modCand = modCand.add(bigInt(1));
	}
	return [];
}

function setResult(res) {
	$("#result").html(res);
}

function formatRec(coeffs) {
	C = coeffs.slice(0);
	ret = "A<sub>n</sub> = ";
	var size = C.length;
	while (C.length > 0 && C[C.length-1].isZero()) C.pop();
	if (C.length == 0) {
		ret += "0";
	}
	for (var i = 0; i < C.length; i++) {
		if (i > 0 && C[i].isNegative()) {
			ret += C[i].abs().toString();
		}
		else {
			ret += C[i].toString();
		}
		ret += " A<sub>n-"+String(i+1)+"</sub>";
		if (i+1 < C.length) {
			if (C[i+1].isNegative()) {
				ret += " - ";
			}
			else {
				ret += " + ";
			}
		}
	}
	ret += " for n ≥ " + (size+1);
	return ret;
}

function coStr(C) {
	var ret = "";
	for (var i = 0; i < C.length; i++) {
		ret += C[i].toString();
		if (i+1 < C.length) ret += ", ";
	}
	return ret;
}

var sequence;
var coefficients;
var modulo;

function compute() {
	sequence = [];
	coefficients = [];
	modulo = false;
	var input = $("#inputseq").val();
	input = String(input);
	var ints = [];
	var t = "";
	for (var i = 0; i < input.length; i++) {
		var c = input.charAt(i);
		if (c >= '0' && c <= '9') {
			t += c;
		}
		else if (c == '-' && t.length == 0) {
			t += c;
		}
		else {
			if (t.length > 0 && !(t.length == 1 && t.charAt(0) == '-')) {
				ints.push(t);
			}
			t = "";
		}
	}
	if (t.length > 0 && !(t.length == 1 && t.charAt(0) == '-')) {
		ints.push(t);
	}
	if (ints.length == 0) {
		setResult("<p>no integers in the input</p>");
		return;
	}
	var useMod = false;
	var mod;
	if ($("#modcheck").is(':checked')) {
		useMod = true;
		var modS = String($("#modulo").val());
		for (var i = 0; i < modS.length; i++) {
			var c = modS.charAt(i);
			if (c < '0' || c > '9') {
				setResult("<p>Could not parse a positive integer modulo</p>");
				return;
			}
		}
		mod = bigInt(modS);
		if (mod.lesser(bigInt(2))) {
			setResult("<p>The modulo should be a prime number =/</p>");
			return;
		}
		if (!mod.isPrime()) {
			setResult("<p>The modulo should be a prime number =/</p>");
			return;
		}
	}
	var bigInts = [];
	for (var i = 0; i < ints.length; i++) {
		bigInts.push(bigInt(ints[i]));
	}
	var coeffs;
	if (useMod) {
		var nonZero = false;
		for (var i = 0; i < bigInts.length; i++) {
			bigInts[i] = bigInts[i].mod(mod);
			bigInts[i] = bigInts[i].add(mod);
			bigInts[i] = bigInts[i].mod(mod);
			
			if (!bigInts[i].isZero()) {
				nonZero = true;
			}
		}
		if (!nonZero) {
			coeffs = [];
		}
		else {
			coeffs = getModCoefficients(bigInts, mod);
		}
		sequence = bigInts.slice(0);
		coefficients = coeffs.slice(0);
		modulo = mod;
	}
	else {
		var nonZero = false;
		for (var i = 0; i < bigInts.length; i++) {
			if (!bigInts[i].isZero()) {
				nonZero = true;
			}
		}
		if (!nonZero) {
			coeffs = [];
		}
		else {
			coeffs = getIntCoefficients(bigInts);
			if (coeffs.length == 0) {
				setResult("<p>No recurrence found. Adding more terms could help.</p>");
				return;
			}
		}
		sequence = bigInts.slice(0);
		coefficients = coeffs.slice(0);
	}
	var res = "";
	if (useMod) {
		if (coeffs.length*2 >= bigInts.length) {
			res = "<p>Warning: the recurrence obtained is long and therefore its existence is trivial. Add more terms to get better results.</p>";
		}
	}
	else {
		if (coeffs.length*2 >= bigInts.length) {
			res = "<p>Warning: the recurrence obtained is long compared to the number of terms provided. Add more terms to get better results.</p>";
		}
	}
	res += "<p>" + formatRec(coeffs) + "</p>";
	res += "<hr>";
	res += "Coefficients: <input type='text' value='" + coStr(coeffs) + "' readonly onClick='this.setSelectionRange(0, this.value.length)'><br>";
	res += "<hr>";
	res += "<div id='cseq'></div>";
	res += "<hr>";
	res += "<div id='matmul'></div>";
	setResult(res);
}

function showTerms(terms) {
	var cont = $("#cseq");
	if (cont.length == 0) return;
	var lessT = Math.max(1, Math.floor(terms/2));
	var moreT = terms*2;
	cont.html("");
	cont.append("<p>Showing "+terms+" first terms of the sequence <a href='' id='showless'>less</a> <a href='' id='showmore'>more</a></p>");
	$("#showless").click(function(){
		showTerms(lessT);
		return false;
	});
	$("#showmore").click(function(){
		showTerms(moreT);
		return false;
	});
	while (sequence.length < terms) {
		var newVal = bigInt(0);
		for (var j = 0; j < coefficients.length; j++) {
			newVal = newVal.add(coefficients[j].multiply(sequence[sequence.length-j-1]));
			if (modulo !== false) {
				newVal = newVal.mod(modulo);
			}
		}
		sequence.push(newVal);
	}
	var res = "<p>";
	for (var i = 0; i < terms; i++) {
		res += sequence[i].toString();
		if (i+1 < terms) res += ", ";
	}
	res += "</p>";
	cont.append(res);
}

function matMul(a, b, s) {
	var ret = new Array(s);
	for (var i = 0; i < s; i++) {
		ret[i] = new Array();
		for (var j = 0; j < s; j++) {
			var newVal = bigInt(0);
			for (var k = 0; k < s; k++) {
				newVal = newVal.add(a[i][k].multiply(b[k][j]));
			}
			if (modulo !== false) {
				newVal = newVal.mod(modulo);
			}
			ret[i].push(newVal);
		}
	}
	return ret;
}

function matPot(m, p, s) {
	if (p.equals(bigInt(1))) return m;
	if (p.isEven()) {
		m = matPot(m, p.shiftRight(1), s);
		return matMul(m, m, s);
	}
	else {
		k = matPot(m, p.minus(bigInt(1)), s);
		return matMul(m, k, s);
	}
}

function getNth(n) {
	n = n.minus(bigInt(1));
	if (n.lesser(bigInt(coefficients.length))) {
		return sequence[n.valueOf()];
	}
	var s = coefficients.length;
	var mat = new Array(s);
	for (var i = 0; i < s; i++) {
		mat[i] = new Array();
	}
	for (var i = 0; i < s; i++) {
		mat[0].push(coefficients[i]);
	}
	for (var i = 1; i < s; i++) {
		for (var j = 0; j < s; j++) {
			if (j == i-1) {
				mat[i].push(bigInt(1));
			}
			else {
				mat[i].push(bigInt(0));
			}
		}
	}
	mat = matPot(mat, n.minus(s).add(bigInt(1)), s);
	var res = bigInt(0);
	for (var i = 0; i < s; i++) {
		res = res.add(mat[0][i].multiply(sequence[s-i-1]));
		if (modulo !== false) {
			res = res.mod(modulo);
		}
	}
	return res;
}

function computeNth() {
	var idS = String($("#nth").val());
	for (var i = 0; i < idS.length; i++) {
		var c = idS.charAt(i);
		if (c < '0' || c > '9') {
			$("#nthresult").html("<p>Could not parse a positive integer index</p>");
			return;
		}
	}
	index = bigInt(idS);
	if (index.lesser(1)) {
		$("#nthresult").html("<p>The index should be a positive integer</p>");
		return;
	}
	$("#nthresult").html("<p>A<sub>"+index.toString()+"</sub> = "+getNth(index).toString()+"</p>");
}

function showMatMul() {
	var cont = $("#matmul");
	if (cont.length == 0) return;
	cont.html("");
	cont.append("Compute nth term: <input type='text' id='nth'><br><button type='button' id='nthbutton'>Compute</button>");	
	cont.append("<div id='nthresult'></div>");
	$("#nthbutton").click(function(){
		$("#nthresult").html("<p>Computing...</p>");
		$("#nthbutton").attr("disabled", true);
		setTimeout(function() {
			computeNth();
			$("#nthbutton").attr("disabled", false);
		}, 0);
	});
}

function callCompute() {
	setResult("<p>Computing...</p>");
	$("#gobutton").attr("disabled", true);
	setTimeout(function() {
		compute();
		$("#gobutton").attr("disabled", false);
		showTerms(16);
		showMatMul();
	}, 0);
}

$(document).ready(function() {
	$("#gobutton").on('click', function() {
		callCompute();
	});
});