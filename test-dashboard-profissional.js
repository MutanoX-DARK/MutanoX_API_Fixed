import http from 'http';

function fazerRequisicao(opcoes) {
  return new Promise((resolve, reject) => {
    const req = http.request(opcoes, (res) => {
      let dados = '';
      res.on('data', (chunk) => dados += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(dados));
        } catch (e) {
          resolve(dados);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function testarDashboardProfissional() {
  const PORT = 8080;
  const HOST = 'localhost';
  const ADMIN_KEY = 'MutanoX3397';
  const TEST_KEY = 'test-key';

  console.log('🧪 Testando Dashboard Profissional - @MutanoX\n');

  // Teste 1: Dashboard HTML
  console.log('Teste 1: Verificando dashboard HTML...');
  try {
    const resposta = await fazerRequisicao({
      hostname: HOST,
      port: PORT,
      path: `/admin?apikey=${ADMIN_KEY}`,
      method: 'GET'
    });
    if (typeof resposta === 'string' && resposta.includes('Professional Dashboard')) {
      console.log('✅ Dashboard HTML carregado com sucesso!');
    } else {
      console.log('❌ Dashboard não foi carregado corretamente');
    }
  } catch (erro) {
    console.log('❌ Erro:', erro.message);
  }

  console.log('\n---\n');

  // Teste 2: Validação Admin
  console.log('Teste 2: Validando Admin Key...');
  try {
    const resposta = await fazerRequisicao({
      hostname: HOST,
      port: PORT,
      path: `/api/admin/validate?apikey=${ADMIN_KEY}`,
      method: 'GET'
    });
    if (resposta.success === true) {
      console.log('✅ Admin Key válida!');
    } else {
      console.log('❌ Admin Key inválida');
    }
  } catch (erro) {
    console.log('❌ Erro:', erro.message);
  }

  console.log('\n---\n');

  // Teste 3: Stats READONLY (não incrementa)
  console.log('Teste 3: Obtendo stats READONLY (não incrementa)...');
  let stats1 = null;
  try {
    const resposta = await fazerRequisicao({
      hostname: HOST,
      port: PORT,
      path: `/api/admin/stats-readonly?apikey=${ADMIN_KEY}`,
      method: 'GET'
    });
    if (resposta.success) {
      console.log('✅ Stats obtidos (NÃO incrementados)!');
      stats1 = resposta;
      console.log(`   Total Requests: ${resposta.totalRequests}`);
      console.log(`   Keys: ${Object.keys(resposta.keys).length}`);
      console.log(`   Endpoints: ${Object.keys(resposta.endpointHits).length}`);
    } else {
      console.log('❌ Erro ao obter stats');
    }
  } catch (erro) {
    console.log('❌ Erro:', erro.message);
  }

  console.log('\n---\n');

  // Teste 4: Múltiplas chamadas ao READONLY
  console.log('Teste 4: Fazendo 5 chamadas ao READONLY...');
  for (let i = 0; i < 5; i++) {
    try {
      await fazerRequisicao({
        hostname: HOST,
        port: PORT,
        path: `/api/admin/stats-readonly?apikey=${ADMIN_KEY}`,
        method: 'GET'
      });
      process.stdout.write('.');
    } catch (erro) {
      console.log('❌');
    }
  }
  console.log('\n   5 chamadas completadas');

  console.log('\n---\n');

  // Teste 5: Verificar se NÃO incrementou
  console.log('Teste 5: Verificando se contador NÃO incrementou...');
  try {
    const resposta = await fazerRequisicao({
      hostname: HOST,
      port: PORT,
      path: `/api/admin/stats-readonly?apikey=${ADMIN_KEY}`,
      method: 'GET'
    });
    if (resposta.success && stats1) {
      const diff = resposta.totalRequests - stats1.totalRequests;
      if (diff === 0) {
        console.log('✅ PERFEITO! Contador NÃO incrementou!');
        console.log(`   Antes: ${stats1.totalRequests}`);
        console.log(`   Depois: ${resposta.totalRequests}`);
        console.log(`   Diferença: ${diff} (esperado: 0)`);
      } else {
        console.log('❌ Contador incrementou inesperadamente!');
        console.log(`   Diferença: ${diff} (esperado: 0)`);
      }
    }
  } catch (erro) {
    console.log('❌ Erro:', erro.message);
  }

  console.log('\n---\n');

  // Teste 6: Consulta real (incrementa)
  console.log('Teste 6: Fazendo consulta de CPF (DEVE incrementar)...');
  let statsAntes = null;
  try {
    const resposta = await fazerRequisicao({
      hostname: HOST,
      port: PORT,
      path: `/api/admin/stats-readonly?apikey=${ADMIN_KEY}`,
      method: 'GET'
    });
    statsAntes = resposta;
    console.log(`   Total antes: ${resposta.totalRequests}`);

    // Consulta CPF
    await fazerRequisicao({
      hostname: HOST,
      port: PORT,
      path: `/api/consultas?tipo=cpf&cpf=12345678900&apikey=${TEST_KEY}`,
      method: 'GET'
    });

    // Stats depois
    const resposta2 = await fazerRequisicao({
      hostname: HOST,
      port: PORT,
      path: `/api/admin/stats-readonly?apikey=${ADMIN_KEY}`,
      method: 'GET'
    });
    console.log(`   Total depois: ${resposta2.totalRequests}`);

    const diff = resposta2.totalRequests - statsAntes.totalRequests;
    if (diff === 1) {
      console.log('✅ PERFEITO! Contador incrementou exatamente 1!');
      console.log(`   Diferença: ${diff} (esperado: 1)`);
    } else {
      console.log('❌ Contador incrementou inesperadamente!');
      console.log(`   Diferença: ${diff} (esperado: 1)`);
    }
  } catch (erro) {
    console.log('❌ Erro:', erro.message);
  }

  console.log('\n---\n');

  // Teste 7: Logs
  console.log('Teste 7: Obtendo logs...');
  try {
    const resposta = await fazerRequisicao({
      hostname: HOST,
      port: PORT,
      path: `/api/admin/logs?apikey=${ADMIN_KEY}`,
      method: 'GET'
    });
    if (resposta.success) {
      console.log('✅ Logs obtidos com sucesso!');
      console.log(`   Total de logs: ${resposta.logs.length}`);
      if (resposta.logs.length > 0) {
        console.log('\n   Últimos 3 logs:');
        resposta.logs.slice(0, 3).forEach(log => {
          console.log(`   [${log.timestamp}] ${log.type} - ${log.message}`);
        });
      }
    }
  } catch (erro) {
    console.log('❌ Erro:', erro.message);
  }

  console.log('\n---\n');

  // Teste 8: Gestão de Keys
  console.log('Teste 8: Testando gestão de keys...');
  try {
    // Listar keys
    const resposta1 = await fazerRequisicao({
      hostname: HOST,
      port: PORT,
      path: `/api/admin/keys?apikey=${ADMIN_KEY}`,
      method: 'GET'
    });
    if (resposta1.success) {
      console.log('✅ Listagem de keys funcionando!');
      console.log(`   Total de keys: ${Object.keys(resposta1.keys).length}`);
    }

    // Toggle key
    const targetKey = Object.keys(resposta1.keys)[0];
    if (targetKey && targetKey !== ADMIN_KEY) {
      const resposta2 = await fazerRequisicao({
        hostname: HOST,
        port: PORT,
        path: `/api/admin/toggle?target=${targetKey}&apikey=${ADMIN_KEY}`,
        method: 'POST'
      });
      if (resposta2.success) {
        console.log('✅ Toggle de key funcionando!');
      }

      // Reverter toggle
      await fazerRequisicao({
        hostname: HOST,
        port: PORT,
        path: `/api/admin/toggle?target=${targetKey}&apikey=${ADMIN_KEY}`,
        method: 'POST'
      });
    }
  } catch (erro) {
    console.log('❌ Erro na gestão de keys:', erro.message);
  }

  console.log('\n🎉 Testes finalizados!\n');
}

testarDashboardProfissional();
