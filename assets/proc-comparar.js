'use strict';

function procHoraMs(data, hora) {
  if (data === null || data === undefined) return null;

  var d = String(data).trim();
  if (!d) return null;

  var m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(d);
  if (!m) return null;

  var dia = parseInt(m[1], 10);
  var mes = parseInt(m[2], 10);
  var ano = parseInt(m[3], 10);

  if (mes < 1 || mes > 12) return null;
  if (dia < 1) return null;

  var ultimoDia = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  if (dia > ultimoDia) return null;

  var hh = 0;
  var mm = 0;

  if (hora !== null && hora !== undefined) {
    var hs = String(hora).trim();
    if (hs) {
      var mh = /^(\d{1,2}):(\d{1,2})$/.exec(hs);
      if (!mh) return null;

      hh = parseInt(mh[1], 10);
      mm = parseInt(mh[2], 10);

      if (hh < 0 || hh > 23) return null;
      if (mm < 0 || mm > 59) return null;
    }
  }

  return Date.UTC(ano, mes - 1, dia, hh, mm, 0, 0);
}

function digitos(v) {
  return String(v === null || v === undefined ? '' : v).replace(/\D/g, '');
}

function ehArray(v) {
  return Object.prototype.toString.call(v) === '[object Array]';
}

function normalizaPlaca(v) {
  return String(v === null || v === undefined ? '' : v)
    .toUpperCase()
    .replace(/[\s\-]/g, '');
}

function limpaCidade(c) {
  var s = c === null || c === undefined ? '' : String(c);
  s = s.replace(/\s*\/\s*[A-Za-z]{2}\s*$/, '');
  return s.replace(/\s+/g, ' ').trim();
}

function extraiUF(c) {
  var s = c === null || c === undefined ? '' : String(c);
  var m = /\/\s*([A-Za-z]{2})\s*$/.exec(s);
  return m ? m[1].toUpperCase() : '';
}

function formataValor(v) {
  if (v === null || v === undefined || v === '') return '';

  var n;

  if (typeof v === 'number') {
    n = v;
  } else {
    var s = String(v).trim();
    if (!s) return '';

    s = s.replace(/R\$\s*/gi, '').trim();

    if (s.indexOf(',') !== -1) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
      s = s.replace(/\./g, '');
    }

    n = parseFloat(s);
  }

  if (!isFinite(n)) return '';

  var negativo = n < 0;
  if (negativo) n = -n;

  var texto = n.toFixed(2).replace('.', ',');
  return 'R$ ' + (negativo ? '-' : '') + texto;
}

function normalizaCaixa(obj) {
  obj = obj || {};

  var cidade = limpaCidade(obj.cidade);

  return {
    numero: obj.numeroProcesso || '',
    hash: obj.hash || '',
    url: obj.url || '',
    servidor: obj.servidor || '',
    placa: normalizaPlaca(obj.placa),
    dataSaida: obj.dataSaida || '',
    horaSaida: obj.horaSaida || '',
    dataChegada: obj.dataChegada || '',
    horaChegada: obj.horaChegada || '',
    cidade: cidade,
    uf: obj.uf || extraiUF(obj.cidade) || '',
    destino: obj.clinicaDestino || '',
    descricao: obj.descricaoSugerida || obj.descricao || '',
    valor: formataValor(
      obj.valorSugerido !== undefined ? obj.valorSugerido : obj.valor
    ),
    empenho: '',
    conferencia: obj.conferencia !== undefined ? obj.conferencia : null
  };
}

function normalizaTabela(obj) {
  obj = obj || {};

  var hash = obj.hash1doc || '';
  var cidade = limpaCidade(obj.cidade);

  return {
    numero: obj.numProcesso || '',
    hash: hash,
    url: hash
      ? 'https://tupancireta.1doc.com.br/?pg=doc%2Fver&hash=' + hash
      : '',
    servidor: obj.servidor || '',
    placa: normalizaPlaca(obj.placa),
    dataSaida: obj.dataSaida || '',
    horaSaida: obj.horaSaida || '',
    dataChegada: obj.dataChegada || '',
    horaChegada: obj.horaChegada || '',
    cidade: cidade,
    uf: extraiUF(obj.cidade),
    destino: '',
    descricao: obj.descricao || '',
    valor: formataValor(obj.valor),
    empenho: obj.empenho || '',
    conferencia: null
  };
}

function procCompararAlvos(p, caixa, tabela) {
  if (!p) return [];

  var proprio = digitos(p.numeroProcesso);
  var lista = [];
  var mapa = {};

  function adicionar(numeroBruto, motivo) {
    if (numeroBruto === null || numeroBruto === undefined) return;

    var num = String(numeroBruto).trim();
    if (!num) return;

    var chave = digitos(num);
    if (!chave) return;
    if (proprio && chave === proprio) return;

    var item = mapa[chave];

    if (!item) {
      item = { numero: num, motivos: [] };
      mapa[chave] = item;
      lista.push(item);
    }

    if (motivo) {
      var texto = String(motivo);
      var existe = false;

      for (var i = 0; i < item.motivos.length; i++) {
        if (item.motivos[i] === texto) {
          existe = true;
          break;
        }
      }

      if (!existe) item.motivos.push(texto);
    }
  }

  /* a) conferência */
  if (p.conferencia && ehArray(p.conferencia.itens)) {
    for (var i = 0; i < p.conferencia.itens.length; i++) {
      var it = p.conferencia.itens[i];
      if (!it || it.nivel === 'ok') continue;

      var motivo = it.texto || '';
      var ev = it.evidencia ? it.evidencia.outro : null;

      if (ev !== null && ev !== undefined) {
        if (ehArray(ev)) {
          for (var j = 0; j < ev.length; j++) {
            adicionar(ev[j], motivo);
          }
        } else {
          adicionar(ev, motivo);
        }
      }

      if (it.texto) {
        var re = /\d{1,2}\.\d{3}\/\d{4}/g;
        var mt;

        while ((mt = re.exec(it.texto)) !== null) {
          adicionar(mt[0], motivo);
        }
      }
    }
  }

  /* b) mesmaDataNaCaixa */
  if (p.mesmaDataNaCaixa !== null && p.mesmaDataNaCaixa !== undefined) {
    var mesmoArr = ehArray(p.mesmaDataNaCaixa)
      ? p.mesmaDataNaCaixa
      : [p.mesmaDataNaCaixa];

    for (var m = 0; m < mesmoArr.length; m++) {
      adicionar(mesmoArr[m], 'Mesma pessoa e mesma data na caixa');
    }
  }

  /* c) histórico */
  if (ehArray(p.historico)) {
    for (var h = 0; h < p.historico.length; h++) {
      var hist = p.historico[h];
      if (!hist) continue;

      var empenho =
        hist.empenho === null || hist.empenho === undefined
          ? ''
          : hist.empenho;

      if (hist.mesmoDia) {
        adicionar(
          hist.processo,
          'Mesma data já empenhada (empenho ' + empenho + ')'
        );
      }

      if (hist.sobrepoe) {
        adicionar(
          hist.processo,
          'Dentro de outra viagem já empenhada (empenho ' + empenho + ')'
        );
      }
    }
  }

  var resultado = [];

  for (var k = 0; k < lista.length; k++) {
    var alvo = lista[k];
    var chaveAlvo = digitos(alvo.numero);
    var encontrado = null;
    var de = 'desconhecido';

    if (ehArray(caixa)) {
      for (var c = 0; c < caixa.length; c++) {
        if (caixa[c] && digitos(caixa[c].numeroProcesso) === chaveAlvo) {
          encontrado = caixa[c];
          de = 'caixa';
          break;
        }
      }
    }

    if (!encontrado && ehArray(tabela)) {
      for (var t = 0; t < tabela.length; t++) {
        if (tabela[t] && digitos(tabela[t].numProcesso) === chaveAlvo) {
          encontrado = tabela[t];
          de = 'tabela';
          break;
        }
      }
    }

    var proc = null;

    if (encontrado) {
      proc =
        de === 'caixa'
          ? normalizaCaixa(encontrado)
          : normalizaTabela(encontrado);
    }

    resultado.push({
      numero: alvo.numero,
      motivos: alvo.motivos.slice(),
      de: de,
      proc: proc
    });
  }

  return resultado;
}

var MAPA_ACENTOS = {
  'á': 'a', 'à': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a', 'å': 'a',
  'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
  'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i',
  'ó': 'o', 'ò': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o',
  'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u',
  'ç': 'c', 'ñ': 'n', 'ý': 'y', 'ÿ': 'y'
};

function normalizaTexto(v) {
  var s = v === null || v === undefined ? '' : String(v);

  s = s.toLowerCase();
  s = s.replace(/[áàâãäåéèêëíìîïóòôõöúùûüçñýÿ]/g, function (ch) {
    return MAPA_ACENTOS[ch] || ch;
  });
  s = s.replace(/\s+/g, ' ').trim();

  return s;
}

function montaDataHora(data, hora) {
  var d = data === null || data === undefined ? '' : String(data).trim();
  var h = hora === null || hora === undefined ? '' : String(hora).trim();

  return (d + ' ' + h).replace(/\s+/g, ' ').trim();
}

function montaBarra(proc, lado) {
  proc = proc || {};

  var inicio = procHoraMs(proc.dataSaida, proc.horaSaida);
  var dataFim = proc.dataChegada || proc.dataSaida;
  var horaFim = proc.horaChegada || proc.horaSaida;
  var fim = procHoraMs(dataFim, horaFim);

  if (inicio === null || fim === null || fim < inicio) return null;

  return { lado: lado, inicio: inicio, fim: fim };
}

function procCompararModelo(a, b) {
  a = a || {};

  var temB = !!b;

  function val(proc, campo) {
    if (!proc) return '';

    if (campo === 'saida') {
      return montaDataHora(proc.dataSaida, proc.horaSaida);
    }

    if (campo === 'chegada') {
      return montaDataHora(proc.dataChegada, proc.horaChegada);
    }

    var v = proc[campo];
    return v === null || v === undefined ? '' : String(v);
  }

  var defs = [
    ['servidor', 'Servidor'],
    ['placa', 'Placa'],
    ['saida', 'Saída'],
    ['chegada', 'Chegada'],
    ['cidade', 'Cidade'],
    ['destino', 'Destino'],
    ['descricao', 'Descrição'],
    ['valor', 'Valor'],
    ['empenho', 'Empenho']
  ];

  var linhas = [];

  for (var i = 0; i < defs.length; i++) {
    var campo = defs[i][0];
    var rotulo = defs[i][1];
    var va = val(a, campo);
    var vb = temB ? val(b, campo) : '';
    var igual;

    if (!temB) {
      igual = false;
    } else {
      igual = normalizaTexto(va) === normalizaTexto(vb);
    }

    linhas.push({
      campo: campo,
      rotulo: rotulo,
      a: va,
      b: vb,
      igual: igual
    });
  }

  var barras = [];
  var barraA = montaBarra(a, 'a');

  if (barraA) barras.push(barraA);

  var barraB = null;

  if (temB) {
    barraB = montaBarra(b, 'b');
    if (barraB) barras.push(barraB);
  }

  var sobreposicao = null;

  if (barraA && barraB) {
    var ini = Math.max(barraA.inicio, barraB.inicio);
    var fim = Math.min(barraA.fim, barraB.fim);
    var diff = fim - ini;

    if (diff > 0) {
      var minutos = Math.round(diff / 60000);

      if (minutos > 0) {
        sobreposicao = {
          inicio: ini,
          fim: fim,
          minutos: minutos
        };
      }
    }
  }

  var faixa = null;

  if (barras.length) {
    var minIni = barras[0].inicio;
    var maxFim = barras[0].fim;

    for (var j = 1; j < barras.length; j++) {
      if (barras[j].inicio < minIni) minIni = barras[j].inicio;
      if (barras[j].fim > maxFim) maxFim = barras[j].fim;
    }

    faixa = {
      inicio: Math.floor(minIni / 3600000) * 3600000,
      fim: Math.ceil(maxFim / 3600000) * 3600000
    };
  }

  return {
    linhas: linhas,
    sobreposicao: sobreposicao,
    faixa: faixa,
    barras: barras
  };
}

var API = {
  procCompararAlvos: procCompararAlvos,
  procCompararModelo: procCompararModelo,
  procHoraMs: procHoraMs,
  procCompararNormalizar: normalizaCaixa
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = API;
} else {
  for (var k in API) window[k] = API[k];
}
