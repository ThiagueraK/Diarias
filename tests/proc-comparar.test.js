'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');

var API = require('../assets/proc-comparar.js');

var procHoraMs = API.procHoraMs;
var procCompararAlvos = API.procCompararAlvos;
var procCompararModelo = API.procCompararModelo;

/* ---------------- dados fictícios ---------------- */

function baseCaixa(over) {
  var o = {
    numeroProcesso: '10.001/2026',
    hash: 'AAA111',
    url: 'https://tupancireta.1doc.com.br/?pg=doc%2Fver&hash=AAA111',
    servidor: 'João da Silva',
    placa: 'ABC1D23',
    dataSaida: '06/11/2026',
    horaSaida: '07:30',
    dataChegada: '06/11/2026',
    horaChegada: '17:30',
    cidade: 'Santa Maria',
    uf: 'RS',
    clinicaDestino: 'Clínica Santa Maria',
    descricaoSugerida: 'Ambulância dois lugares',
    valorSugerido: 148.02,
    historico: [],
    mesmaDataNaCaixa: [],
    conferencia: { status: 'pronto', itens: [] }
  };
  if (over) {
    for (var k in over) o[k] = over[k];
  }
  return o;
}

function baseTabela(over) {
  var o = {
    numProcesso: '10.003/2026',
    servidor: 'Maria Souza',
    cidade: 'Cruz Alta/RS',
    placa: 'Tqs-3e50',
    dataSaida: '06/11/2026',
    horaSaida: '15:00',
    dataChegada: '06/11/2026',
    horaChegada: '22:40',
    hash1doc: 'BBB222',
    empenho: '013531',
    valor: '148,02',
    descricao: 'Ambulância dois lugares',
    pago: true
  };
  if (over) {
    for (var k in over) o[k] = over[k];
  }
  return o;
}

function baseNormalizado(over) {
  var o = {
    numero: '10.001/2026',
    hash: 'AAA111',
    url: 'https://tupancireta.1doc.com.br/?pg=doc%2Fver&hash=AAA111',
    servidor: 'João da Silva',
    placa: 'ABC1D23',
    dataSaida: '06/11/2026',
    horaSaida: '07:30',
    dataChegada: '06/11/2026',
    horaChegada: '17:30',
    cidade: 'Santa Maria',
    uf: 'RS',
    destino: 'Clínica Santa Maria',
    descricao: 'Ambulância dois lugares',
    valor: 'R$ 148,02',
    empenho: '',
    conferencia: null
  };
  if (over) {
    for (var k in over) o[k] = over[k];
  }
  return o;
}

/* ---------------- 1. procHoraMs ---------------- */

test('procHoraMs converte data e hora em milissegundos UTC', function () {
  assert.equal(procHoraMs('06/11/2026', '07:30'), Date.UTC(2026, 10, 6, 7, 30, 0, 0));
  assert.equal(procHoraMs('06/11/2026'), Date.UTC(2026, 10, 6, 0, 0, 0, 0));
  assert.equal(procHoraMs('06/11/2026', ''), Date.UTC(2026, 10, 6, 0, 0, 0, 0));
  assert.equal(procHoraMs('06/11/2026', '7:05'), Date.UTC(2026, 10, 6, 7, 5, 0, 0));
  assert.equal(procHoraMs('07/11/2026', '03:00'), Date.UTC(2026, 10, 7, 3, 0, 0, 0));
});

test('procHoraMs devolve null para entradas inválidas', function () {
  assert.equal(procHoraMs(null, '07:30'), null);
  assert.equal(procHoraMs('', '07:30'), null);
  assert.equal(procHoraMs('2026-11-06', '07:30'), null);
  assert.equal(procHoraMs('06/11/2026', '25:00'), null);
  assert.equal(procHoraMs('06/11/2026', '07:60'), null);
  assert.equal(procHoraMs('31/02/2026', '07:30'), null);
  assert.equal(procHoraMs('06/13/2026'), null);
});

/* ---------------- 2. procCompararAlvos ---------------- */

test('procCompararAlvos devolve lista vazia sem processos', function () {
  assert.deepEqual(procCompararAlvos(null, null, null), []);
  assert.deepEqual(procCompararAlvos({}, null, null), []);
  assert.deepEqual(procCompararAlvos({ numeroProcesso: '10.001/2026' }, null, null), []);
});

test('procCompararAlvos coleta motivos na ordem, sem repetir e sem o próprio número', function () {
  var p = baseCaixa({
    numeroProcesso: '40.001/2026',
    conferencia: {
      status: 'alerta',
      itens: [
        { nivel: 'ok', codigo: 'OK', texto: 'Tudo certo com 40.004/2026', evidencia: { outro: '40.004/2026' } },
        { nivel: 'alerta', codigo: 'A', texto: 'Conflito com o processo 40.003/2026', evidencia: { outro: '40.003/2026' } },
        { nivel: 'alerta', codigo: 'B', texto: 'Outro conflito', evidencia: { outro: '40.005/2026' } },
        { nivel: 'atencao', codigo: 'C', texto: 'Ver também 40.006/2026', evidencia: { outro: ['40.007/2026', '40.001/2026'] } }
      ]
    },
    mesmaDataNaCaixa: ['40.002/2026'],
    historico: [
      { data: '06/11/2026', empenho: '099', processo: '40.002/2026', mesmoDia: true },
      { data: '06/11/2026', empenho: '077', processo: '40.008/2026', sobrepoe: true }
    ]
  });

  var res = procCompararAlvos(p, null, null);

  assert.deepEqual(res.map(function (r) { return r.numero; }), [
    '40.003/2026',
    '40.005/2026',
    '40.007/2026',
    '40.006/2026',
    '40.002/2026',
    '40.008/2026'
  ]);

  assert.deepEqual(res[0].motivos, ['Conflito com o processo 40.003/2026']);
  assert.deepEqual(res[1].motivos, ['Outro conflito']);
  assert.deepEqual(res[2].motivos, ['Ver também 40.006/2026']);
  assert.deepEqual(res[3].motivos, ['Ver também 40.006/2026']);
  assert.deepEqual(res[4].motivos, [
    'Mesma pessoa e mesma data na caixa',
    'Mesma data já empenhada (empenho 099)'
  ]);
  assert.deepEqual(res[5].motivos, ['Dentro de outra viagem já empenhada (empenho 077)']);

  for (var i = 0; i < res.length; i++) {
    assert.equal(res[i].de, 'desconhecido');
    assert.equal(res[i].proc, null);
  }
});

test('procCompararAlvos ignora o número do próprio processo', function () {
  var p = {
    numeroProcesso: '10.001/2026',
    conferencia: {
      status: 'alerta',
      itens: [
        { nivel: 'alerta', codigo: 'X', texto: 'Repete o próprio 10.001/2026', evidencia: { outro: '10.001/2026' } }
      ]
    },
    mesmaDataNaCaixa: ['10.001/2026'],
    historico: [{ processo: '10.001/2026', mesmoDia: true, empenho: '001' }]
  };

  assert.deepEqual(procCompararAlvos(p, null, null), []);
});

test('procCompararAlvos resolve caixa antes da tabela e normaliza os dois formatos', function () {
  var p = baseCaixa({
    numeroProcesso: '50.001/2026',
    mesmaDataNaCaixa: ['50.009/2026', '50.010/2026', '50.011/2026']
  });

  var outroCaixa = baseCaixa({
    numeroProcesso: '50.009/2026',
    hash: 'CCC333',
    url: 'https://url/ccc',
    servidor: 'José',
    placa: 'Tqs-3e50',
    dataSaida: '07/11/2026',
    horaSaida: '08:00',
    dataChegada: '07/11/2026',
    horaChegada: '09:00',
    cidade: 'Cruz Alta/RS',
    uf: 'RS',
    clinicaDestino: 'Clínica Y',
    descricaoSugerida: undefined,
    descricao: 'Descrição alternativa',
    valorSugerido: 148.02,
    conferencia: null
  });

  var linha = baseTabela({ numProcesso: '50.010/2026' });
  var presenteNosDois = baseTabela({ numProcesso: '50.009/2026', servidor: 'Da tabela' });

  var res = procCompararAlvos(p, [outroCaixa], [linha, presenteNosDois]);

  assert.equal(res.length, 3);
  assert.equal(res[0].de, 'caixa');
  assert.equal(res[1].de, 'tabela');
  assert.equal(res[2].de, 'desconhecido');
  assert.equal(res[2].proc, null);

  var n = res[0].proc;
  assert.equal(n.numero, '50.009/2026');
  assert.equal(n.hash, 'CCC333');
  assert.equal(n.url, 'https://url/ccc');
  assert.equal(n.servidor, 'José');
  assert.equal(n.placa, 'TQS3E50');
  assert.equal(n.dataSaida, '07/11/2026');
  assert.equal(n.horaSaida, '08:00');
  assert.equal(n.dataChegada, '07/11/2026');
  assert.equal(n.horaChegada, '09:00');
  assert.equal(n.cidade, 'Cruz Alta');
  assert.equal(n.uf, 'RS');
  assert.equal(n.destino, 'Clínica Y');
  assert.equal(n.descricao, 'Descrição alternativa');
  assert.equal(n.valor, 'R$ 148,02');
  assert.equal(n.empenho, '');
  assert.equal(n.conferencia, null);

  var t = res[1].proc;
  assert.equal(t.numero, '50.010/2026');
  assert.equal(t.hash, 'BBB222');
  assert.equal(t.url, 'https://tupancireta.1doc.com.br/?pg=doc%2Fver&hash=BBB222');
  assert.equal(t.placa, 'TQS3E50');
  assert.equal(t.cidade, 'Cruz Alta');
  assert.equal(t.uf, 'RS');
  assert.equal(t.destino, '');
  assert.equal(t.descricao, 'Ambulância dois lugares');
  assert.equal(t.valor, 'R$ 148,02');
  assert.equal(t.empenho, '013531');
  assert.equal(t.conferencia, null);
});

test('procCompararAlvos deixa url da tabela vazia sem hash e mantém conferência só da caixa', function () {
  var conferencia = {
    status: 'alerta',
    itens: [{ nivel: 'alerta', codigo: 'X', texto: 'y', evidencia: { outro: '70.002/2026' } }]
  };

  var resCaixa = procCompararAlvos(
    { numeroProcesso: '70.001/2026', mesmaDataNaCaixa: ['70.002/2026'] },
    [baseCaixa({ numeroProcesso: '70.002/2026', conferencia: conferencia })],
    null
  );
  assert.deepEqual(resCaixa[0].proc.conferencia, conferencia);

  var resTabela = procCompararAlvos(
    { numeroProcesso: '70.001/2026', mesmaDataNaCaixa: ['70.003/2026'] },
    null,
    [baseTabela({ numProcesso: '70.003/2026', hash1doc: undefined })]
  );
  assert.equal(resTabela[0].de, 'tabela');
  assert.equal(resTabela[0].proc.hash, '');
  assert.equal(resTabela[0].proc.url, '');
  assert.equal(resTabela[0].proc.conferencia, null);
});

/* ---------------- 3. procCompararModelo ---------------- */

test('procCompararModelo monta linhas na ordem e compara sem acento e sem caixa', function () {
  var a = baseNormalizado({ servidor: 'João  da   Silva' });
  var b = baseNormalizado({
    servidor: 'JOAO DA SILVA',
    placa: 'TQS3E50',
    horaSaida: '15:00',
    horaChegada: '22:40',
    destino: 'Clinica Santa Maria',
    descricao: 'AMBULANCIA DOIS LUGARES'
  });

  var r = procCompararModelo(a, b);

  assert.deepEqual(r.linhas.map(function (l) { return l.rotulo; }), [
    'Servidor', 'Placa', 'Saída', 'Chegada', 'Cidade', 'Destino', 'Descrição', 'Valor', 'Empenho'
  ]);
  assert.deepEqual(r.linhas.map(function (l) { return l.campo; }), [
    'servidor', 'placa', 'saida', 'chegada', 'cidade', 'destino', 'descricao', 'valor', 'empenho'
  ]);

  assert.equal(r.linhas[0].igual, true);
  assert.equal(r.linhas[1].igual, false);
  assert.equal(r.linhas[2].a, '06/11/2026 07:30');
  assert.equal(r.linhas[2].b, '06/11/2026 15:00');
  assert.equal(r.linhas[2].igual, false);
  assert.equal(r.linhas[3].a, '06/11/2026 17:30');
  assert.equal(r.linhas[3].b, '06/11/2026 22:40');
  assert.equal(r.linhas[4].igual, true);
  assert.equal(r.linhas[5].igual, true);
  assert.equal(r.linhas[6].igual, true);
  assert.equal(r.linhas[7].igual, true);
  assert.equal(r.linhas[8].igual, true);
});

test('procCompararModelo trata vazio dos dois lados como igual e vazio contra preenchido como diferente', function () {
  var a = baseNormalizado({ destino: '', empenho: '' });
  var b = baseNormalizado({ destino: '', empenho: '' });
  var r = procCompararModelo(a, b);
  var porCampo = {};
  r.linhas.forEach(function (l) { porCampo[l.campo] = l; });
  assert.equal(porCampo.destino.a, '');
  assert.equal(porCampo.destino.b, '');
  assert.equal(porCampo.destino.igual, true);
  assert.equal(porCampo.empenho.igual, true);

  var c = baseNormalizado({ destino: 'Clínica X' });
  var d = baseNormalizado({ destino: '' });
  var r2 = procCompararModelo(c, d);
  var porCampo2 = {};
  r2.linhas.forEach(function (l) { porCampo2[l.campo] = l; });
  assert.equal(porCampo2.destino.igual, false);
});

test('procCompararModelo calcula sobreposição de 150 minutos e faixa das 07:00 às 23:00', function () {
  var a = baseNormalizado({});
  var b = baseNormalizado({ horaSaida: '15:00', horaChegada: '22:40' });

  var r = procCompararModelo(a, b);

  assert.deepEqual(r.sobreposicao, {
    inicio: Date.UTC(2026, 10, 6, 15, 0, 0, 0),
    fim: Date.UTC(2026, 10, 6, 17, 30, 0, 0),
    minutos: 150
  });
  assert.deepEqual(r.faixa, {
    inicio: Date.UTC(2026, 10, 6, 7, 0, 0, 0),
    fim: Date.UTC(2026, 10, 6, 23, 0, 0, 0)
  });
  assert.equal(r.barras.length, 2);
  assert.equal(r.barras[0].lado, 'a');
  assert.equal(r.barras[0].inicio, Date.UTC(2026, 10, 6, 7, 30, 0, 0));
  assert.equal(r.barras[0].fim, Date.UTC(2026, 10, 6, 17, 30, 0, 0));
  assert.equal(r.barras[1].lado, 'b');
  assert.equal(r.barras[1].inicio, Date.UTC(2026, 10, 6, 15, 0, 0, 0));
  assert.equal(r.barras[1].fim, Date.UTC(2026, 10, 6, 22, 40, 0, 0));
});

test('procCompararModelo devolve sobreposicao null quando não há interseção', function () {
  var a = baseNormalizado({ horaSaida: '07:30', horaChegada: '09:00' });
  var b = baseNormalizado({ horaSaida: '15:00', horaChegada: '17:00' });

  var r = procCompararModelo(a, b);

  assert.equal(r.sobreposicao, null);
  assert.deepEqual(r.faixa, {
    inicio: Date.UTC(2026, 10, 6, 7, 0, 0, 0),
    fim: Date.UTC(2026, 10, 6, 17, 0, 0, 0)
  });
});

test('procCompararModelo omite barra quando a chegada é antes da saída', function () {
  var a = baseNormalizado({ horaSaida: '18:00', horaChegada: '08:00' });

  var r = procCompararModelo(a, null);

  assert.deepEqual(r.barras, []);
  assert.equal(r.sobreposicao, null);
  assert.equal(r.faixa, null);
});

test('procCompararModelo aceita viagem com pernoite e arredonda a faixa para hora cheia', function () {
  var a = baseNormalizado({
    dataSaida: '06/11/2026',
    horaSaida: '22:00',
    dataChegada: '07/11/2026',
    horaChegada: '03:30'
  });

  var r = procCompararModelo(a, null);

  assert.equal(r.barras.length, 1);
  assert.equal(r.barras[0].inicio, Date.UTC(2026, 10, 6, 22, 0, 0, 0));
  assert.equal(r.barras[0].fim, Date.UTC(2026, 10, 7, 3, 30, 0, 0));
  assert.deepEqual(r.faixa, {
    inicio: Date.UTC(2026, 10, 6, 22, 0, 0, 0),
    fim: Date.UTC(2026, 10, 7, 4, 0, 0, 0)
  });
  assert.equal(r.sobreposicao, null);
});

test('procCompararModelo com b null devolve b vazio e igual false', function () {
  var a = baseNormalizado({});
  var r = procCompararModelo(a, null);

  assert.equal(r.linhas.length, 9);
  r.linhas.forEach(function (l) {
    assert.equal(l.b, '');
    assert.equal(l.igual, false);
  });

  var empenho = null;
  r.linhas.forEach(function (l) {
    if (l.campo === 'empenho') empenho = l;
  });
  assert.equal(empenho.a, '');
  assert.equal(empenho.igual, false);

  assert.equal(r.barras.length, 1);
  assert.equal(r.barras[0].lado, 'a');
  assert.equal(r.sobreposicao, null);
});
