"use strict";

class ACL {
    #loggedId = null;

    #listAllowedBasicUser = ["kanban.html", "tarefa.html"];

    constructor() {
        this.#loggedId = sessionStorage.getItem("sessao_usuario");

        this.#run();
    }

    #run() {
        if (typeof DB !== "object") {
            setTimeout((_) => {
                this.#run();
            });
        } else {
            this.#aclInterface();
            this.#aclNav();
        }
    }

    /**
     * Remover itens da interface, caso não seja admin
     */
    async #aclInterface() {
        if (!(await DB.isAdminUserId(this.#loggedId))) {
            $('[data-for-admin="1"]').remove();
        }
    }

    /**
     * Controlar páginas que podem ser acessadas
     */
    async #aclNav() {
        var path = window.location.href.split("/").pop().split("?").shift();

        if (!(await DB.isAdminUserId(this.#loggedId)) && !this.#listAllowedBasicUser.includes(path)) {
            window.location.href = this.#listAllowedBasicUser.shift();
        }
    }
}

var acl = new ACL();
