"use strict";

class Kanban {
    #taskTemplate = `
<div class="card card-light card-outline">
    <div class="card-header">
        <h5 class="card-title">%task:title%</h5>
        <div class="card-tools">
            <a href="tarefa.html?id=%task:id%" class="btn btn-tool btn-link">#%task:id%</a>
            <a href="tarefa.html?id=%task:id%" class="btn btn-tool">
                <i class="fas fa-pen"></i>
            </a>
        </div>
    </div>
    <div class="card-body">
        <p style="white-space: pre-line;">%task:description%</p>
    </div>
</div>
`;

    #filterUserId = 0;

    constructor() {
        this.#loadDependency();
    }

    /**
     * Carregar dependências
     */
    #loadDependency() {
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
            {
                class: "ACL",
                file: "acl.js",
            },
        ];

        var count = 0;

        $(lists).each((idx, lib) => {
            if (typeof lib.class !== "function") {
                var script = document.createElement("script");

                script.src = `assets/app/libs/${lib.file}`;
                script.onload = async () => {
                    count++;

                    if (count >= lists.length) {
                        this.#listarUsuarios();
                        this.#bindFilter();

                        this.#reloadAllTasks();

                        this.#proccessAcl();
                    }
                };

                document.head.appendChild(script);
            }
        });
    }

    /**
     * Escutar o filtro de usuários
     */
    async #bindFilter() {
        $("#filtroUsuario").on("change", () => {
            this.#filterUserId = $("#filtroUsuario").val();

            this.#reloadAllTasks();
        });
    }

    /**
     * Carrega todos os tipos de tarefas
     */
    async #reloadAllTasks() {
        this.#loadTasksStep(Variables.BACKLOG_ID);
        this.#loadTasksStep(Variables.PRIORIZADO_ID);
        this.#loadTasksStep(Variables.EM_ANDAMENTO_ID);
        this.#loadTasksStep(Variables.FINALIZADO_ID);
    }

    /**
     * Carregar itens do step informado
     */
    async #loadTasksStep(step) {
        $(`#tasks_${step}`).html("");

        var tasks = await DB.getAllTastksOnStep(step, this.#filterUserId > 0 ? this.#filterUserId : null);

        if (tasks != undefined) {
            for (var i = 0; i < tasks.length; i++) {
                var html = await this.#renderTask(tasks[i]);

                $(`#tasks_${step}`).append(html);
            }
        }
    }

    /**
     * Renderiza a tarefa recebida em HTML
     */
    async #renderTask(task) {
        var html = this.#taskTemplate;

        html = html.replace(/%task:id%/g, task.id);
        html = html.replace(/%task:title%/g, task.title);
        html = html.replace(/%task:description%/g, task.description);

        return html;
    }

    /**
     * Buscar lista de usuários no banco de dados
     */
    async #listarUsuarios() {
        var lista = await DB.listAllUsers();

        if (!lista) return false;

        $("#filtroUsuario").html($("<option>").html("-- Todos os usuários --").val(0));

        for (var i = 0; i < lista.length; i++) {
            $("#filtroUsuario").append(
                $("<option>").html(`${lista[i].name} (${lista[i].occupation})`).val(lista[i].id)
            );
        }
    }

    /**
     * Reprocessa em caso de aplicação de ACL
     */
    async #proccessAcl() {
        if (typeof DB !== "object") {
            setTimeout((_) => {
                this.#proccessAcl();
            });
        } else {
            var userId = sessionStorage.getItem("sessao_usuario");

            if (!(await DB.isAdminUserId(userId))) {
                this.#filterUserId = userId;
                this.#reloadAllTasks();
            }
        }
    }
}

/**
 * Inicializa ao terminar load no DOM
 */
$(document).ready(() => {
    var l = new Kanban();
});
