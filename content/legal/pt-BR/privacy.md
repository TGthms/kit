# Política de privacidade

**Última atualização:** 15 de julho de 2026

Esta política descreve como as informações são tratadas quando você usa o **Kit**, um conjunto de utilitários publicado como um site estático e criado para funcionar no seu navegador.

## Ideia central

O Kit foi projetado para que **o trabalho nos seus arquivos aconteça no seu dispositivo**. Não operamos um servidor de aplicação que receba, armazene ou analise o conteúdo de documentos, imagens ou mídias que você abre nas ferramentas.

## O que o Kit não faz

Quando você usa as ferramentas (por exemplo, para mesclar PDFs ou compactar imagens):

- Seus arquivos **não são enviados** a um back-end do Kit para processamento.
- Nós **não** criamos contas de usuário.
- Nós **não** vendemos dados pessoais.
- Nós **não** usamos SDKs de publicidade nem rastreamento entre sites para anúncios.

## Informações que podem existir ao redor do serviço

### 1. Dados que permanecem no seu dispositivo

Seu navegador pode armazenar localmente informações limitadas, como:

- Preferências de aparência (claro, escuro ou sistema)
- Idioma escolhido
- Ferramentas favoritas ou fixadas
- **Resumos do histórico** (ferramenta usada, aproximadamente quando, breve descrição) — **não** o conteúdo dos seus arquivos
- Predefinições que você escolher salvar

Você pode limpar o histórico nas Configurações ou excluir os dados deste site no navegador.

### 2. Registros de rede e hospedagem

O Kit normalmente é hospedado como arquivos estáticos (por exemplo, no GitHub Pages). Quando seu navegador solicita páginas e recursos, o provedor de hospedagem pode registrar dados técnicos padrão, como endereço IP, agente do usuário, carimbos de data e hora e URLs solicitadas. Esse registro é controlado pela infraestrutura e pelas políticas do provedor, não por um servidor do Kit que abre seus documentos.

### 3. Recursos opcionais de terceiros

Alguns recursos avançados podem carregar bibliotecas de processamento (por exemplo, núcleos FFmpeg WebAssembly ou scripts worker de PDF) de redes de distribuição de conteúdo na primeira vez que você os usar. Essas solicitações podem expor metadados de rede padrão ao CDN. O conteúdo dos seus arquivos continua sendo processado no navegador; o CDN fornece código, não seus documentos.

### 4. Cotações de moedas

Ao atualizar cotações de moedas, este navegador consulta a API pública do Frankfurter. A solicitação pode compartilhar com o Frankfurter metadados de rede padrão, como endereço IP, user agent, horário e URL solicitada. As cotações podem vir do cache deste navegador e estar desatualizadas. São apenas dados de referência diários, não uma garantia para negociação, contabilidade, impostos ou liquidação.

## Aplicativo Web Progressivo (PWA)

Se você instalar o Kit ou permitir o uso off-line, um service worker poderá armazenar em cache **a estrutura do aplicativo** (páginas, scripts, estilos e ícones). O Kit não foi projetado para armazenar seus arquivos pessoais nesse cache.

## Crianças

O Kit é um utilitário de uso geral. Não é direcionado a menores de 13 anos e, como não oferece contas, não coletamos conscientemente informações pessoais de crianças por meio de um sistema de cadastro.

## Alterações

Podemos atualizar esta política quando o produto ou os requisitos legais mudarem. Quando fizermos isso, revisaremos a data de “Última atualização”. Continuar usando o Kit após uma atualização significa que você analisou a política revisada.

## Contato

Dúvidas sobre privacidade: [contact.timg@icloud.com](mailto:contact.timg@icloud.com).

Publicado por **Tim G (GitHub: TGthms)**.
