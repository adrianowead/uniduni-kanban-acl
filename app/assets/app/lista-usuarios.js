"use strict";

class ListaUsuarios {
    #templateCard = `
<div class="col-md-4">
    <div class="card card-primary card-outline">
      <div class="card-body box-profile">
        <div class="text-center">
          <img
            class="profile-user-img img-fluid img-circle"
            src="%user:avatar%"
            alt="%user:nome%"
          />
        </div>

        <h3 class="profile-username text-center">%user:nome%</h3>

        <p class="text-muted text-center">%user:occupation%</p>

        <ul class="list-group list-group-unbordered mb-3">
          <li class="list-group-item">
            <b>Backlog</b> <a class="float-right">%user:backlogCount%</a>
          </li>
          <li class="list-group-item">
            <b>Priorizado</b> <a class="float-right">%user:priorizadoCount%</a>
          </li>
          <li class="list-group-item">
            <b>Em Andamento</b> <a class="float-right">%user:andamentoCount%</a>
          </li>
          <li class="list-group-item">
            <b>Finalizado</b> <a class="float-right">%user:finalizadoCount%</a>
          </li>
        </ul>

        <a href="perfil.html?id=%user:id%" class="btn btn-primary btn-block"
          ><b>Editar</b></a
        >
      </div>
      <!-- /.card-body -->
    </div>
    <!-- /.card -->
  </div>
`;

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

            $("#listaUsuarios").append(html);
        }
    }

    /**
     * Renderiza o perfil recebido em HTML
     */
    async #renderProfile(profile) {
        var html = this.#templateCard;

        var countKanban = await DB.countAssingedToUserIdAllSteps(profile.id);

        // avatar
        if (profile.avatar && profile.avatar.length > 0) {
            html = html.replace(/%user:avatar%/g, profile.avatar);
        } else {
            html = html.replace(/%user:avatar%/g, "assets/img/avatar.png");
        }

        html = html.replace(/%user:id%/g, profile.id);
        html = html.replace(/%user:nome%/g, profile.name);
        html = html.replace(/%user:occupation%/g, profile.occupation);
        html = html.replace(/%user:backlogCount%/g, countKanban.backlog);
        html = html.replace(/%user:priorizadoCount%/g, countKanban.priorizado);
        html = html.replace(/%user:andamentoCount%/g, countKanban.emAndamento);
        html = html.replace(/%user:finalizadoCount%/g, countKanban.finalizado);

        return html;
    }
}

/**
 * Inicializa ao terminar load no DOM
 */
$(document).ready(() => {
    var l = new ListaUsuarios();
});