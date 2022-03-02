"use strict";

class LockScreen {
    #userId = null;
    #formLock = null;
    #senha = "";

    constructor() {
        this.#loadDependency().then((_) => {
            if (!sessionStorage.getItem("lock_user") || sessionStorage.getItem("lock_user") <= 0) {
                LockScreen.anotherUser();
            } else {
                this.#userId = sessionStorage.getItem("lock_user");

                this.#mostrarLogado();
                this.#bindSubmitLock();
            }
        });
    }

    /**
     * Carregar dependências
     */
    #loadDependency() {
        return new Promise((resolve) => {
            var lists = [
                {
                    class: "Variables",
                    file: "variables.js",
                },
                {
                    class: "Database",
                    file: "database.js",
                },
                {
                    class: "PerfilLogado",
                    file: "perfil-logado.js",
                },
            ];

            var count = 0;

            $(lists).each((idx, lib) => {
                if (typeof lib.class !== "function") {
                    var script = document.createElement("script");

                    script.src = `assets/app/libs/${lib.file}`;
                    script.onload = () => {
                        count++;

                        if (count >= lists.length) {
                            resolve(true);
                        }
                    };

                    document.head.appendChild(script);
                }
            });
        });
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

            // avatar
            if (user.avatar && user.avatar != null) {
                $("#lockAvatar").attr("src", user.avatar).attr("alt", user.name);
            } else {
                $("#lockAvatar").attr("src", "assets/img/avatar.png").attr("alt", user.name);
            }

            $("#lockNome").html(user.name);
        }
    }

    /**
     * Zera a sessão e direciona para login
     */
    static anotherUser() {
        sessionStorage.removeItem("lock_user");
        PerfilLogado.deslogar();
    }

    /**
     * Escuta envio de deslogar
     */
    #bindSubmitLock() {
        this.#formLock = $("#formLock");

        if (this.#formLock) {
            $(this.#formLock).bind("submit", (evt) => {
                this.#senha = $.trim(this.#formLock.find("#senha").val());

                if (this.#senha.length <= 0) {
                    $("#aviso").html("Informe a senha!");
                } else {
                    this.#validarEDestravar();
                }

                return false;
            });
        }
    }

    /**
     * Validar o usuário na base de dados e destravar
     */
    async #validarEDestravar() {
        var result = await DB.unlockUser(this.#userId, this.#senha);

        if (!result) {
            $("#aviso").html("Dados inválidos!");

            return false;
        }

        sessionStorage.removeItem("lock_user");

        sessionStorage.setItem('sessao_usuario', this.#userId);

        window.top.location.href = "dash.html";
    }
}

/**
 * Inicializa ao terminar load no DOM
 */
$(document).ready(() => {
    var l = new LockScreen();
});
