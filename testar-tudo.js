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

async function testarAPI() {
  const PORT = 8080;
  const HOST = 'localhost';
  const ADMIN_KEY = 'MutanoX3397';
  const TEST_KEY = 'test-key';

  console.log('🧪 Iniciando testes da API MutanoX (do repositório original)...\n');

  // Teste 1: Dashboard HTML
  console.log('Teste 1: Acessando dashboard HTML...');
  try {
    const resposta = await fazerRequisicao({
      hostname: HOST,
      port: PORT,
      path: `/admin?apikey=${ADMIN_KEY}`,
      method: 'GET'
    });
    if (typeof resposta === 'string' && resposta.includes('MUTANOX')) {
      console.log('✅ Dashboard HTML acessível!');
    } else {
      console.log('❌ Resposta inesperada');
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

  // Teste 3: Stats do Admin
  console.log('Teste 3: Obtendo stats do Admin...');
  try {
    const resposta = await fazerRequisicao({
      hostname: HOST,
      port: PORT,
      path: `/api/admin/stats?apikey=${ADMIN_KEY}`,
      method: 'GET'
    });
    if (resposta.success) {
      console.log('✅ Stats obtidos com sucesso!');
      console.log(`   Total Requests: ${resposta.totalRequests}`);
      console.log(`   Keys: ${Object.keys(resposta.keys).length}`);
      console.log(`   Uptime: ${Math.floor(resposta.uptime / 1000)}s`);
    } else {
      console.log('❌ Erro ao obter stats');
    }
  } catch (erro) {
    console.log('❌ Erro:', erro.message);
  }

  console.log('\n---\n');

  // Teste 4: Consulta de Telefone 65999701064
  console.log('Teste 4: Consultando telefone 65999701064 (API REAL)...');
  try {
    const resposta = await fazerRequisicao({
      hostname: HOST,
      port: PORT,
      path: `/api/consultas?tipo=numero&q=65999701064&apikey=${TEST_KEY}`,
      method: 'GET'
    });
    if (resposta.sucesso) {
      console.log('✅ Consulta realizada com sucesso!');
      console.log(`   Total de resultados: ${resposta.totalResultados}`);
      if (resposta.resultados && resposta.resultados.length > 0) {
        const primeiro = resposta.resultados[0];
        console.log('   Primeiro resultado:');
        console.log(`   Nome: ${primeiro.nome || 'N/A'}`);
        console.log(`   CPF/CNPJ: ${primeiro.cpfCnpj || 'N/A'}`);
        console.log(`   Cidade/UF: ${primeiro.cidadeUF || 'N/A'}`);
        console.log(`   Bairro: ${primeiro.bairro || 'N/A'}`);
        console.log(`   CEP: ${primeiro.cep || 'N/A'}`);

        // Teste 5: Consultar CPF retornado
        if (primeiro.cpfCnpj && primeiro.cpfCnpj.length === 11) {
          console.log('\n---\n');
          console.log(`Teste 5: Consultando CPF ${primeiro.cpfCnpj} (API REAL)...`);
          try {
            const respostaCPF = await fazerRequisicao({
              hostname: HOST,
              port: PORT,
              path: `/api/consultas?tipo=cpf&cpf=${primeiro.cpfCnpj}&apikey=${TEST_KEY}`,
              method: 'GET'
            });
            if (respostaCPF.sucesso) {
              console.log('✅ Consulta de CPF realizada com sucesso!');
              if (respostaCPF.dados && respostaCPF.dados.dadosBasicos) {
                const dados = respostaCPF.dados.dadosBasicos;
                console.log(`   Nome: ${dados.nome || 'N/A'}`);
                console.log(`   CPF: ${dados.cpf || 'N/A'}`);
                console.log(`   CNS: ${dados.cns || 'N/A'}`);
                console.log(`   Data Nascimento: ${dados.dataNascimento || 'N/A'}`);
                console.log(`   Sexo: ${dados.sexo || 'N/A'}`);
                console.log(`   Situação Cadastral: ${dados.situacaoCadastral || 'N/A'}`);
                console.log(`   Data Situação: ${dados.dataSituacao || 'N/A'}`);

                if (respostaCPF.dados.dadosEconomicos) {
                  const econ = respostaCPF.dados.dadosEconomicos;
                  console.log('\n   Dados Econômicos:');
                  console.log(`   Renda: ${econ.renda || 'N/A'}`);
                  console.log(`   Poder Aquisitivo: ${econ.poderAquisitivo || 'N/A'}`);
                  console.log(`   Faixa de Renda: ${econ.faixaRenda || 'N/A'}`);
                  console.log(`   Score CSBA: ${econ.scoreCSBA || 'N/A'}`);
                }

                if (respostaCPF.dados.enderecos && respostaCPF.dados.enderecos.length > 0) {
                  console.log('\n   Endereços:');
                  respostaCPF.dados.enderecos.forEach((end, i) => {
                    console.log(`   ${i + 1}. ${end.logradouro}, ${end.bairro}, ${end.cidadeUF}, CEP: ${end.cep}`);
                  });
                }
              }
            } else {
              console.log('❌ Erro na consulta de CPF:', respostaCPF.erro);
            }
          } catch (erro) {
            console.log('❌ Erro ao consultar CPF:', erro.message);
          }
        }
      }
    } else {
      console.log('❌ Erro na consulta:', resposta.erro);
    }
  } catch (erro) {
    console.log('❌ Erro:', erro.message);
  }

  console.log('\n---\n');

  // Teste 6: Consulta por Nome
  console.log('Teste 6: Consultando por nome...');
  try {
    const resposta = await fazerRequisicao({
      hostname: HOST,
      port: PORT,
      path: `/api/consultas?tipo=nome&q=Silva&apikey=${TEST_KEY}`,
      method: 'GET'
    });
    if (resposta.sucesso) {
      console.log('✅ Consulta por nome realizada com sucesso!');
      console.log(`   Total de resultados: ${resposta.totalResultados}`);
      if (resposta.resultados && resposta.resultados.length > 0) {
        console.log('\n   Primeiros 3 resultados:');
        resposta.resultados.slice(0, 3).forEach((pessoa, i) => {
          console.log(`   ${i + 1}. ${pessoa.nome} - CPF: ${pessoa.cpf || 'N/A'} - ${pessoa.situacaoCadastral || 'N/A'}`);
        });
      }
    } else {
      console.log('❌ Erro na consulta:', resposta.erro);
    }
  } catch (erro) {
    console.log('❌ Erro:', erro.message);
  }

  console.log('\n---\n');

  // Teste 7: Logs do Admin
  console.log('Teste 7: Obtendo logs do Admin...');
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
        console.log('\n   Últimos 5 logs:');
        resposta.logs.slice(0, 5).forEach(log => {
          console.log(`   [${log.timestamp}] ${log.type} - ${log.message}`);
        });
      }
    } else {
      console.log('❌ Erro ao obter logs');
    }
  } catch (erro) {
    console.log('❌ Erro:', erro.message);
  }

  console.log('\n🎉 Testes finalizados!\n');
}

testarAPI();
