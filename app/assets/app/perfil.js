"use strict";

class Perfil {
    #formProfile = null;
    #avatarImage = null;

    #editingId = null;

    #nome = null;
    #cargo = null;
    #email = null;
    #senha = null;
    #isAdmin = null;
    #isBlock = null;

    constructor() {
        var url = new URLSearchParams(window.location.search);
        this.#editingId = url.get("id");

        if (this.#editingId) {
            this.#interfaceToEdit();
        }

        this.#loadDependency();
    }

    #interfaceToEdit() {
        $("#senha").parent("div").remove();

        $("div.card-primary").eq(0).removeClass("card-primary").addClass("card-success");
        $("img.profile-user-img").eq(0).removeClass("border-primary").addClass("border-success");
        $("button.btn-primary").eq(0).removeClass("btn-primary").addClass("btn-success");

        $("#email").attr("readonly", true);
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
                        this.#bindPreviewAvatar();
                        this.#bindSubmitProfile();
                        this.#loadEditingUser();
                    }
                };

                document.head.appendChild(script);
            }
        });
    }

    /**
     * Escuta envio de perfil
     */
    #bindSubmitProfile() {
        this.#formProfile = $("#formProfile");

        if (this.#formProfile) {
            $(this.#formProfile).bind("submit", (evt) => {
                this.#nome = $.trim(this.#formProfile.find("#nome").val());
                this.#cargo = $.trim(this.#formProfile.find("#cargo").val());
                this.#isAdmin = this.#formProfile.find("#is_admin").is(":checked");
                this.#isBlock = this.#formProfile.find("#is_blocked").is(":checked");

                if (!this.#editingId) {
                    this.#email = $.trim(this.#formProfile.find("#email").val());
                    this.#senha = $.trim(this.#formProfile.find("#senha").val());
                }

                if (
                    this.#nome.length <= 0 ||
                    this.#cargo.length <= 0 ||
                    (!this.#editingId && this.#email.length <= 0) ||
                    (!this.#editingId && this.#senha.length <= 0)
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
     * Bind para exibir o preview do avatar antes de salvar
     */
    #bindPreviewAvatar() {
        var avatarInput = document.getElementById("avatar");
        var avatarPreview = document.getElementById("previewAvatar");

        avatarInput.onchange = (event) => {
            const [file] = avatarInput.files;

            if (file) {
                // preview com BLOB
                avatarPreview.src = URL.createObjectURL(file);

                // armazenamento em base64
                var read = new FileReader();
                read.addEventListener("load", (e) => {
                    this.#avatarImage = e.target.result;
                });
                read.readAsDataURL(file);
            }
        };
    }

    /**
     * Validar o usuário na base de dados e salvar
     */
    async #validarESalvar() {
        // verificar se já esxite um usuário com esse email
        var userId = await DB.selectUserIdFromEmail(this.#email);

        if (userId != undefined) {
            if (this.#editingId == null) {
                $("#aviso").html("Já existe um usuário com este email!");
            }
        }

        if (this.#editingId == null) {
            await DB.addNewUser(
                this.#email,
                this.#senha,
                this.#isAdmin,
                this.#isBlock,
                this.#cargo,
                this.#nome,
                this.#avatarImage
            );
        } else if (this.#editingId != null && this.#editingId != localStorage.getItem("sessao_usuario")) {
            var result = await DB.updateUser(
                this.#editingId,
                this.#isAdmin,
                this.#isBlock,
                this.#cargo,
                this.#nome,
                this.#avatarImage
            );

            if (result == -1) {
                $("#aviso").html("Não é possível editar esse perfil, o usuário não existe!");

                return false;
            }
        } else {
            $("#aviso").html("Não é possível editar o próprio perfil!");

            return false;
        }

        window.top.location.href = "lista-usuarios.html";
    }

    async #loadEditingUser() {
        if (this.#editingId != null) {
            var user = await DB.selectUserFromId(this.#editingId);

            if (user.avatar) {
                $("#previewAvatar").attr("src", user.avatar);
                this.#avatarImage = user.avatar;
            }

            $("#nome").val(user.name);
            $("#cargo").val(user.occupation);
            $("#email").val(user.login);

            $("#is_admin").prop("checked", user.is_admin == "1");
            $("#is_blocked").prop("checked", user.is_blocked == "1");

            if (this.#editingId == sessionStorage.getItem("sessao_usuario")) $("#btnSave").attr("disabled", true);
        }
    }
}

/**
 * Inicializa ao terminar load no DOM
 */
$(document).ready(() => {
    var l = new Perfil();
});
