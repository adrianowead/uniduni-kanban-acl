"use strict";

class Perfil {
    #editingId = null;

    #formTask = null;

    #titulo = null;
    #descricao = null;
    #atribuidoPara = null;
    #state = null;

    constructor() {
        var url = new URLSearchParams(window.location.search);
        this.#editingId = url.get("id");

        this.#loadDependency();
    }

    async #interfaceToEdit() {
        if (!(await DB.isAdminUserId(sessionStorage.getItem('sessao_usuario')))) {
            // não pode trocar título da tarefa
            $("#titulo").prop('disabled', true);

            // não pode trocar usuário da tarefa
            $("#assignedToUserId").prop('disabled', true);

            // se a tarefa já não estiver em backlog, não pode voltar para backlog
            if($("#currentState").val() != 'backlog') {
                $("option[value='backlog']").remove();
            }

            // se a tarefa já estiver finalizado, não pode mais alterar o documento
            if($("#currentState").val() == 'finalizado') {
                $("#btnSave").prop('disabled', true);
            }
        }
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
                        await this.#loadEditingTask();

                        this.#listarUsuarios();
                        this.#bindSaveTask();
                        this.#bindChangeState();
                    }
                };

                document.head.appendChild(script);
            }
        });
    }

    async #loadEditingTask() {
        if (this.#editingId != null) {
            $("#taskTitle").html("Atualização de tarefa");

            DB.selectTaskFromId(this.#editingId).then((task) => {
                if (task != undefined) {
                    $("#titulo").val(task.title);
                    $("#descricao").val(task.description);

                    this.#atribuidoPara = task.assigned_to_user_id;

                    setTimeout((_) => {
                        $("#currentState").val(task.current_step).trigger("change");

                        this.#interfaceToEdit();
                    }, 500);
                }
            });
        }
    }

    /**
     * Buscar lista de usuários no banco de dados
     */
    async #listarUsuarios() {
        var lista = await DB.listAllUsers();

        if (!lista) return false;

        $("#assignedToUserId").html($("<option>").html("-- selecione um usuário --").val(0));

        for (var i = 0; i < lista.length; i++) {
            $("#assignedToUserId").append(
                $("<option>").html(`${lista[i].name} (${lista[i].occupation})`).val(lista[i].id)
            );
        }

        if (this.#atribuidoPara != null) $("#assignedToUserId").val(this.#atribuidoPara);
    }

    /**
     * Escuta o evento de salvar
     */
    #bindSaveTask() {
        this.#formTask = $("#formTask");

        if (this.#formTask) {
            $(this.#formTask).bind("submit", (evt) => {
                this.#titulo = $.trim(this.#formTask.find("#titulo").val());
                this.#descricao = $.trim(this.#formTask.find("#descricao").val());
                this.#state = $.trim(this.#formTask.find("#currentState").val());

                this.#atribuidoPara = $.trim(this.#formTask.find("#assignedToUserId").val());

                if (
                    this.#titulo.length <= 0 ||
                    this.#descricao.length <= 0 ||
                    this.#state.length <= 0 ||
                    (!this.#editingId && this.#atribuidoPara.length <= 0)
                ) {
                    $("#aviso").html("Todos os campos, exceto o avatar, são obrigatórios!");
                } else {
                    this.#validarESalvar();
                }

                return false;
            });
        }
    }

    /**
     * Validar o usuário na base de dados e salvar
     */
    async #validarESalvar() {
        if (!this.#editingId) {
            await DB.addNewTask(this.#titulo, this.#descricao, this.#atribuidoPara, this.#state);
        } else {
            await DB.updateTask(this.#editingId, this.#titulo, this.#descricao, this.#atribuidoPara, this.#state);
        }

        window.top.location.href = "kanban.html";
    }

    async #bindChangeState() {
        $("#currentState").on("change", (event) => {
            switch ($("#currentState").val()) {
                case "backlog":
                    this.#changeColors("secondary");
                    $("#btnSave span").html("Backlog");
                    break;
                case "priorizado":
                    this.#changeColors("primary");
                    $("#btnSave span").html("Priorizado");
                    break;
                case "em_andamento":
                    this.#changeColors("info");
                    $("#btnSave span").html("Em Andamento");
                    break;
                case "finalizado":
                    this.#changeColors("success");
                    $("#btnSave span").html("Finalizado");
                    break;
            }
        });
    }

    /**
     * Remove classes de definição de cor
     */
    async #changeColors(newColor) {
        var colors = ["primary", "secondary", "info", "success"];

        colors.forEach((color) => {
            $("#colorCard").removeClass(`card-${color}`);
            $("#currentState").removeClass(`border-${color}`);
            $("#btnSave").removeClass(`btn-${color}`);
        });

        $("#colorCard").addClass(`card-${newColor}`);
        $("#currentState").addClass(`border-${newColor}`);
        $("#btnSave").addClass(`btn-${newColor}`);
    }
}

/**
 * Inicializa ao terminar load no DOM
 */
$(document).ready(() => {
    var l = new Perfil();
});
