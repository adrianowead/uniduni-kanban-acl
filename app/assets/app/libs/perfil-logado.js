"use strict";

class PerfilLogado {
    #segundosChecagem = 10 * 60; // 10 minutos de inatividade para lockscreen

    #userId = 0;

    #templateCard = `
<div class="user-panel mt-3 pb-3 mb-3 d-flex">
    <div class="image">
      <img
        src="%user:avatar%"
        class="img-circle elevation-2"
        alt="%user:nome%"
      />
    </div>
    <div class="info">
      <a href="perfil.html?id=%user:id%" class="d-block">%user:nome%</a>
    </div>
  </div>
  <div class="mt-2 mb-3" style="width:100%; overflow:hidden;">
    <button type="button" id="btnLogout" class="btn btn-block btn-danger btn-sm">Sair</button>
</div>
`;

    constructor() {
        this.#userId = sessionStorage.getItem("sessao_usuario");

        if(!this.#userId) {
            PerfilLogado.deslogar();
        }

        this.#mostrarLogado();
        this.#validarSeLogado();
        this.#controleLockScreen();
    }

    /**
     * Buscar dados do usuário logado
     */
    async #mostrarLogado() {
        if (typeof DB !== "object") {
            setTimeout(() => {
                this.#mostrarLogado();
            }, 1000);
        } else {
            var user = await DB.selectUserFromId(this.#userId);

            var html = this.#renderProfile(user);

            $("#loggedProfile").html(html);

            $("#btnLogout").bind("click", () => {
                if (window.confirm("Deseja realmente sair?")) {
                    PerfilLogado.deslogar();
                }
            });
        }
    }

    /**
     * Renderiza o perfil recebido em HTML
     */
    #renderProfile(profile) {
        var html = this.#templateCard;

        // avatar
        if (profile.avatar && profile.avatar != null) {
            html = html.replace(/%user:avatar%/g, profile.avatar);
        } else {
            html = html.replace(/%user:avatar%/g, "assets/img/avatar.png");
        }

        html = html.replace(/%user:id%/g, profile.id);
        html = html.replace(/%user:nome%/g, profile.name);

        return html;
    }

    /**
     * Se não estiver logado, direciona para a tela de login
     */
    #validarSeLogado() {
        if (!this.#userId) {
            PerfilLogado.deslogar();
        }
    }

    /**
     * Limpa a sessão de volta para o login
     */
    static deslogar() {
        localStorage.clear();
        sessionStorage.clear();

        window.top.location.href = "index.html";
    }

    /**
     * Controla o tempo de lockscreen
     */
    async #controleLockScreen(counter = 0) {
        if (counter > 0) {
            sessionStorage.setItem("lock_user", this.#userId);
        }

        if (sessionStorage.getItem("lock_user") > 0) {
            var path = window.location.href.split("/").pop();

            if (path != "lockscreen.html") {
                window.top.location.href = "lockscreen.html";
            }
        }

        // reprocessar
        setTimeout(async (_) => await this.#controleLockScreen(counter + 1), this.#segundosChecagem * 1000);
    }
}

var l = new PerfilLogado();
