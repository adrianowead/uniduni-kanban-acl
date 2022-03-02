"use strict";

class Dash {
    #templateCard = `
<tr>
    <td>
        <img
            src="%user:avatar%"
            alt="%user:nome%"
            class="img-circle img-size-32 mr-2"
        />
        %user:nome%
        <small>(%user:occupation%)</small>
    </td>
    <td>%user:totalTasks%</td>
    <td>
        <div class="progressoUser">
            <div class="bg-secondary" style="width:%user:backlogProgress%%;" title="Backlog (%user:backlogProgress%%)">&nbsp;</div>
            <div class="bg-primary" style="width:%user:priorizadoProgress%%;" title="Priorizado (%user:priorizadoProgress%%)">&nbsp;</div>
            <div class="bg-info" style="width:%user:emAndamentoProgress%%;" title="Em Andamento (%user:emAndamentoProgress%%)">&nbsp;</div>
            <div class="bg-success" style="width:%user:finalizadoProgress%%;" title="Finalizado (%user:finalizadoProgress%%)">&nbsp;</div>
        </div>
    </td>
</tr>
`;

    #reportData = "";

    constructor() {
        this.#loadDependency();

        $("#downloadReport").bind("click", () => this.downloadReport());
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
                script.onload = () => {
                    count++;

                    if (count >= lists.length) {
                        this.#listarUsuarios();
                    }
                };

                document.head.appendChild(script);
            }
        });
    }

    /**
     * Buscar lista de usuários no banco de dados
     */
    async #listarUsuarios() {
        var lista = await DB.listAllUsers();

        if (!lista) return false;

        for (var i = 0; i < lista.length; i++) {
            var html = await this.#renderProfile(lista[i]);

            $("#desempenhoUsers").append(html);
        }

        this.#prepareReport(lista);
    }

    /**
     * Renderiza o perfil recebido em HTML
     */
    async #renderProfile(profile) {
        var html = this.#templateCard;

        var countKanban = await DB.countAssingedToUserIdAllSteps(profile.id);
        var totalCount =
            countKanban.backlog + countKanban.priorizado + countKanban.emAndamento + countKanban.finalizado;

        // avatar
        if (profile.avatar && profile.avatar.length > 0) {
            html = html.replace(/%user:avatar%/g, profile.avatar);
        } else {
            html = html.replace(/%user:avatar%/g, "assets/img/avatar.png");
        }

        html = html.replace(/%user:id%/g, profile.id);
        html = html.replace(/%user:nome%/g, profile.name);
        html = html.replace(/%user:occupation%/g, profile.occupation);
        html = html.replace(/%user:totalTasks%/g, totalCount);

        html = html.replace(
            /%user:backlogProgress%/g,
            countKanban.backlog > 0 ? (100 * countKanban.backlog) / totalCount : 0
        );
        html = html.replace(
            /%user:priorizadoProgress%/g,
            countKanban.priorizado > 0 ? (100 * countKanban.priorizado) / totalCount : 0
        );
        html = html.replace(
            /%user:emAndamentoProgress%/g,
            countKanban.emAndamento > 0 ? (100 * countKanban.emAndamento) / totalCount : 0
        );
        html = html.replace(
            /%user:finalizadoProgress%/g,
            countKanban.finalizado > 0 ? (100 * countKanban.finalizado) / totalCount : 0
        );

        return html;
    }

    /**
     * Deixa os dados de relatório preparados para download
     */
    async #prepareReport(lista) {
        this.#reportData = "";

        var data = [["Usuário", "Profissão", "Backlog", "Priorizado", "Em Andamento", "Finalizado", "Total"]];

        for (var i = 0; i < lista.length; i++) {
            var countKanban = await DB.countAssingedToUserIdAllSteps(lista[i].id);

            data.push([
                lista[i].name,
                lista[i].occupation,
                countKanban.backlog,
                countKanban.priorizado,
                countKanban.emAndamento,
                countKanban.finalizado,
                countKanban.backlog + countKanban.priorizado + countKanban.emAndamento + countKanban.finalizado,
            ]);
        }

        this.#reportData = "data:text/csv;charset=utf-8," + data.map((e) => e.join(",")).join("\n");
    }

    /**
     * Gera CSV com o relatório dos usuários
     */
    downloadReport() {
        var encodedUri = encodeURI(this.#reportData);

        var link = document.createElement("a");

        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "UniDUNI Relatório de desempenho.csv");

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);
    }
}

/**
 * Inicializa ao terminar load no DOM
 */
$(document).ready(() => {
    var l = new Dash();
});
