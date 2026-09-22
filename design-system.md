# Design System Calazans

## Visao geral

O design system Calazans combina performance, disciplina e clareza operacional. A interface deve transmitir uma presenca institucional forte, com superficies limpas, contraste alto e acoes facilmente identificaveis em desktop e mobile.

## Identidade visual

### Cores primarias

| Token                | Hex       | Uso                                                                      |
| -------------------- | --------- | ------------------------------------------------------------------------ |
| Azul Royal           | `#1A3E95` | Cor primaria de destaque, botoes, links, estados ativos, foco e selecoes |
| Azul Marinho Noturno | `#0A142F` | Textos de maior peso, fundos escuros e superficies de alto contraste     |

### Cores de suporte

| Token               | Hex       | Uso                                                              |
| ------------------- | --------- | ---------------------------------------------------------------- |
| Branco Puro         | `#FFFFFF` | Texto sobre Azul Royal, superficies claras e contraste principal |
| Cinza Azulado Claro | `#E4E9F0` | Fundo do modo claro e areas de respiro                           |
| Cinza Ardósia       | `#CCD5E1` | Bordas, divisores, campos e fundos secundarios                   |

### Regras de cor

- Acoes primarias usam Azul Royal `#1A3E95` com texto Branco Puro `#FFFFFF`.
- O hover da acao primaria deve escurecer sutilmente para manter a hierarquia sem perder identidade.
- O Azul Marinho Noturno e reservado para textos de maior peso e fundos escuros.
- Bordas e superficies auxiliares usam os tons de Cinza Azulado para separar blocos sem criar ruido visual.
- Estados de foco devem ser visiveis e usar o Azul Royal, sempre com contraste suficiente.

## Tipografia

- A marca usa uma sans-serif geometrica robusta, preferencialmente em uppercase, com peso forte.
- Titulos e informacoes principais usam pesos bold ou black e pouco texto.
- Textos de apoio, labels e descricoes usam pesos regulares ou medium, com line-height confortavel.
- A tipografia deve priorizar legibilidade, hierarquia e leitura rapida em telas pequenas.

## Componentes

### Cartoes e superficies

- Use cantos arredondados no estilo squircle, representados por `rounded-2xl` ou equivalente.
- O cartao principal deve ter borda discreta e separacao clara do fundo.
- Use sombras suaves no estilo drop shadow 2.5D: profundidade perceptivel, sem efeito pesado ou difuso demais.

### Botoes

- Botoes primarios usam Azul Royal com texto Branco Puro.
- Estados hover, focus e active devem ser perceptiveis, mas discretos.
- O texto deve ser curto, direto e orientado a acao.

### Campos e selecoes

- Campos devem ter bordas em Cinza Ardósia e foco em Azul Royal.
- Perfis e abas selecionados usam Azul Royal para borda, texto e realce de fundo.
- Labels devem manter contraste forte com a superficie em ambos os temas.

## Temas

### Modo claro

- Fundo da pagina: Cinza Azulado Claro `#E4E9F0`.
- Cartoes: Branco Puro `#FFFFFF`.
- Bordas e divisores: Cinza Ardósia `#CCD5E1`.
- Textos principais: Azul Marinho Noturno `#0A142F`.

### Modo escuro

- Fundo da pagina: Azul Marinho Noturno `#0A142F`.
- Cartao: superficie azul-marinho profunda, derivada do Azul Marinho Noturno.
- Textos: Branco Puro e Cinza Azulado claro para garantir alto contraste.
- Bordas: Azul dessaturado e Cinza Ardósia em baixa intensidade.

A alternancia entre temas deve ser nativa, imediata e preservar a hierarquia visual dos componentes.
