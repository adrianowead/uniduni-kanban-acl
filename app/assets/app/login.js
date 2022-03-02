"use strict";

class Login {
    #formLogin = null;
    #email = "";
    #senha = "";
    #lembrar = false;

    constructor() {
        this.#loadDependency();
    }

    /**
     * Carregar dependências
     */
    #loadDependency() {
        var lists = ["database.js"];

        var count = 0;

        $(lists).each((idx, lib) => {
            var script = document.createElement("script");

            script.src = `assets/app/libs/${lib}`;
            script.onload = () => {
                count++;

                if (count >= lists.length) {
                    this.#logIfRemember();
                    this.#bindSubmitLogin();
                }
            };

            document.head.appendChild(script);
        });
    }

    /**
     * Logar o usuário, se estiver marcado para relembrar
     */
    async #logIfRemember() {
        if (localStorage.getItem("sessao_usuario")) {
            var block = await DB.isBlockedUserId(localStorage.getItem("sessao_usuario"));

            if (!block) {
                this.#makeUserIdSession(localStorage.getItem("sessao_usuario"));
            }
        }
    }

    /**
     * Escuta envio de login
     */
    #bindSubmitLogin() {
        this.#formLogin = $("#formLogin");

        if (this.#formLogin) {
            $(this.#formLogin).bind("submit", (evt) => {
                this.#email = $.trim(this.#formLogin.find("#login").val());
                this.#senha = $.trim(this.#formLogin.find("#senha").val());
                this.#lembrar = this.#formLogin.find("#remember").is(":checked");

                if (this.#email.length <= 0 || this.#senha.length <= 0) {
                    $("#aviso").html("Campo de Email e senha, são obrigatórios!");
                } else {
                    this.#validarLogin();
                }

                return false;
            });
        }
    }

    /**
     * Valida e se permitido efetua login
     */
    #validarLogin() {
        DB.selectUserId(this.#email, this.#senha).then((userId) => {
            if (userId) {
                this.#makeUserIdSession(userId.id);
            } else {
                $("#aviso").html("Login inválido ou bloqueado!");
            }
        });
    }

    /**
     * Cria sessão para o usuário
     * A persistência depende se o usuário escolheu manter o login ou não
     */
    #makeUserIdSession(userId) {
        if (this.#lembrar) {
            localStorage.setItem("sessao_usuario", userId);
        } else {
            localStorage.removeItem("sessao_usuario");
        }

        sessionStorage.setItem("sessao_usuario", userId);

        // direcioando para o dashboard
        window.top.location.href = "dash.html";
    }
}

/**
 * Inicializa ao terminar load no DOM
 */
$(document).ready(() => {
    var l = new Login();
});
