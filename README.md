# Gerenciador de tarefas, com ACL

Todo o desenvolvimento foi feito para funcionar no navegador, então para um teste simples basta abrir o __index.html__.

## Distribuição

Para a distribuição do projeto, é necessário ter no seu ambiente:

- [NodeJS](https://nodejs.org/pt-br/)
    - npm
    - Yarn

A instalação do NPM não é necessária, pois já vem com a instalação principal do NodeJS.

A utilização do Yarn é opcional, para instalar execute o comando abaixo (após instalação do NodeJS).

```shell
npm install -g yarn@latest
```

## Compilação

Para compilar a aplicação, execute algum dos comandos abaixo, na raíz da aplicação:

_Compilar para Windows 64 bits_
```shell
yarn winx64
```



```shell
npx electron-packager ./ "uniduni" --platform=linux,win32 --arch=x64 --app-copyright="UniDUNI - 2022" --app-version=1.0.0 --icon=../assets/img/logo.png --out=build --prune=true --overwrite --asar
```