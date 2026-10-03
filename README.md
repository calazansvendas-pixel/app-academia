# React + Vite

## Persistencia no Firestore

O app usa a instancia `db` exportada por `src/firebase.js`. Antes de usar,
crie o banco Cloud Firestore `(default)` no projeto Firebase configurado.

- `machines/{machineId}`: catalogo global, com `name` e foto base64 opcional em `photo`.
- `users/{userId}`: metadados do perfil (`name`, `role`). O perfil Calazans e provisionado em `users/calazans` com `role: 'admin'`.
- `users/{userId}/workout/current`: selecao (`selecionados`), series, exercicios concluidos e videos por ID da maquina.
- `users/{userId}/history/{historyId}`: data ISO, academia, status e snapshot dos exercicios e series ao encerrar o treino.

Catalogo e perfis usam `onSnapshot`. O app comum assina apenas os dados e o
historico do perfil ativo; a tela Historico Geral assina os historicos dos
usuarios apenas quando aberta por um administrador. Os listeners sao removidos
ao trocar de perfil ou de tela. Encerrar treino grava historico e limpa progresso
em um lote atomico. A exclusao exige role admin e verifica novamente o documento
do usuario antes de `deleteDoc`; historicos encerrados sao preservados.

Os dados legados do `localStorage` nao sao enviados automaticamente nem apagados.
O Firestore passa a ser a fonte do catalogo, perfis e treinos. Importe os dados
legados separadamente, mantendo os IDs das maquinas e a associacao aos perfis,
para evitar sobrescrever dados compartilhados. Fotos base64 novas devem ter
menos de 900.000 caracteres devido ao limite de tamanho do documento Firestore.

### Seguranca antes de producao

A selecao local de perfil nao autentica o usuario. Para isolamento seguro,
configure Firebase Authentication, associe cada perfil ao UID autenticado e
publique regras Firestore que permitam:

- Leitura dos metadados publicos dos perfis e do catalogo global.
- Exclusao de maquinas somente por um UID cujo documento `users/{uid}` tenha role admin.
- Leitura/escrita de `workout/current` apenas pelo dono, com acesso administrativo para limpeza de referencias.
- Leitura de `history` pelo dono ou administrador; gravacao pelo dono.
- Alteracao de roles e provisionamento do administrador somente por um ambiente confiavel.

Nao use regras abertas em producao. A verificacao de role no frontend nao
substitui autorizacao no servidor. O bootstrap atual de Calazans deve ser
substituido por provisionamento confiavel ao adicionar autenticacao.

Validacao local: `npm run lint`, `npm run build` e testes de fluxo com Firestore
simulado. A conexao real depende do banco e das regras configurados no Firebase.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
