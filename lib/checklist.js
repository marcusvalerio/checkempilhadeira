export const SECOES = [
  {
    titulo: "Estrutura e conservação",
    itens: [
      { id: "pneus", label: "Pneus ou rodas em boas condições", dica: "Sem cortes, desgaste excessivo ou deformações." },
      { id: "garfos", label: "Garfos sem trincas, deformações ou danos", dica: "Verifique pontas, calcanhar e travas." },
      { id: "torre", label: "Torre de elevação sem danos aparentes", dica: "Colunas, trilhos e roletes íntegros." },
      { id: "correntes", label: "Correntes e mangueiras sem danos aparentes", dica: "Sem elos frouxos, rachaduras ou ressecamento." },
      { id: "vazamentos", label: "Ausência de vazamentos de óleo ou combustível", dica: "Olhe o piso embaixo da máquina." },
    ],
  },
  {
    titulo: "Itens de segurança",
    itens: [
      { id: "cinto", label: "Cinto de segurança em boas condições", dica: "Trava e fita sem desgaste." },
      { id: "buzina", label: "Buzina funcionando" },
      { id: "alarme_re", label: "Alarme de ré funcionando" },
      { id: "luzes", label: "Luzes e sinalizadores funcionando", dica: "Faróis, giroflex e luz azul/vermelha." },
      { id: "extintor", label: "Extintor presente e dentro da validade (quando aplicável)", na: true },
      { id: "espelhos", label: "Espelhos retrovisores em boas condições" },
    ],
  },
  {
    titulo: "Funcionamento operacional",
    itens: [
      { id: "freios", label: "Freios funcionando corretamente" },
      { id: "freio_estacionamento", label: "Freio de estacionamento funcionando" },
      { id: "direcao", label: "Direção funcionando corretamente" },
      { id: "elevacao", label: "Elevação e inclinação dos garfos funcionando" },
      { id: "painel", label: "Painel e indicadores sem alertas anormais" },
    ],
  },
];
export const ITENS = SECOES.flatMap((s) => s.itens);
export const imagem = (id) => `/pecas/${id}.svg`;
export const TURNOS = ["1º Turno (Manhã)", "2º Turno (Tarde)", "3º Turno (Noite)"];
