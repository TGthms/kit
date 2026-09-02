# Política de privacidade

**Última atualização:** 15 de julho de 2026

Esta política descreve o modo como as informações são tratadas quando utiliza o **Kit**, um conjunto de utilitários publicado como um site estático e concebido para funcionar no seu navegador.

## Ideia central

O Kit foi concebido para que **o trabalho nos seus ficheiros ocorra no seu dispositivo**. Não operamos um servidor de aplicações que receba, armazene ou analise o conteúdo dos documentos, imagens ou ficheiros multimédia que abre nas ferramentas.

## O que o Kit não faz

Quando utiliza as ferramentas (por exemplo, para unir PDFs ou comprimir imagens):

- Os seus ficheiros **não são carregados** para um back-end do Kit para processamento.
- **Não** criamos contas de utilizador.
- **Não** vendemos dados pessoais.
- **Não** utilizamos SDKs de publicidade nem rastreamento entre sites para anúncios.

## Informações que podem existir em torno do serviço

### 1. Dados que permanecem no seu dispositivo

O seu navegador pode armazenar localmente informações limitadas, como:

- Preferências de aparência (claro, escuro ou sistema)
- Idioma escolhido
- Ferramentas favoritas ou afixadas
- **Resumos do histórico** (ferramenta utilizada, momento aproximado, breve descrição) — **não** o conteúdo dos seus ficheiros
- Predefinições que escolha guardar

Pode limpar o histórico nas Definições ou eliminar os dados deste site no navegador.

### 2. Registos de rede e alojamento

O Kit é normalmente alojado como ficheiros estáticos no **Cloudflare Pages** (sítio canónico: trykit.pages.dev), com uma cópia no GitHub Pages. Quando o seu navegador solicita páginas e recursos, o fornecedor de alojamento pode registar dados técnicos padrão, como endereço IP, agente do utilizador, carimbos de data e hora e URLs solicitados. Esse registo é controlado pela infraestrutura e pelas políticas do fornecedor, não por um servidor do Kit que abra os seus documentos.

### 3. Recursos opcionais de terceiros

As ferramentas de PDF carregam o worker do pdf.js, os tipos de letra e os recursos relacionados **deste mesmo sítio** (incluídos na app). As ferramentas de áudio e vídeo carregam um motor FFmpeg WebAssembly **deste mesmo sítio**. O conteúdo dos seus ficheiros permanece no navegador; essas bibliotecas são código da aplicação, não um destino para o qual enviamos os seus documentos.

### 4. Taxas de câmbio

Ao atualizar taxas de câmbio, este navegador consulta a API pública do Frankfurter. O pedido pode partilhar com o Frankfurter metadados de rede padrão, como endereço IP, user agent, hora e URL pedida. As taxas podem vir da cache deste navegador e estar desatualizadas. São apenas dados de referência diários, não uma garantia para negociação, contabilidade, impostos ou liquidação.

## Aplicação Web Progressiva (PWA)

Se instalar o Kit ou permitir a utilização offline, um service worker poderá colocar em cache **a estrutura da aplicação** (páginas, scripts, estilos e ícones). O Kit não foi concebido para armazenar os seus ficheiros pessoais nessa cache.

## Crianças

O Kit é um utilitário de uso geral. Não se destina a menores de 13 anos e, como não oferece contas, não recolhemos conscientemente informações pessoais de crianças através de um sistema de registo.

## Alterações

Podemos atualizar esta política quando o produto ou os requisitos legais mudarem. Nesse caso, reveremos a data de “Última atualização”. A utilização continuada do Kit após uma atualização significa que analisou a política revista.

## Contacto

Questões de privacidade: [contact.timg@icloud.com](mailto:contact.timg@icloud.com).

Publicado por **Tim G (GitHub: TGthms)**.
