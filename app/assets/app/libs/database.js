"use strict";

class Database {
    #db = null;

    constructor() {
        this.#db = openDatabase(
            "gerenciador-tarefas",
            "1.0",
            "Gerenciador de Tarefas e ACL",
            2 * 1024 * 1024 // 2MB
        );

        this.#createAllTables();

        this.#createDefaultMaster();
    }

    /**
     * Cria todas as tabelas bases da aplicação
     */
    #createAllTables() {
        this.#db.transaction((tx) => {
            tx.executeSql(
                "CREATE TABLE IF NOT EXISTS tb_users (id INTEGER PRIMARY KEY, login TEXT, passwd TEXT, is_admin INTEGER, is_blocked INTEGER, avatar TEXT, occupation TEXT, name TEXT)"
            );
            tx.executeSql(
                "CREATE TABLE IF NOT EXISTS tb_kanban (id INTEGER PRIMARY KEY, assigned_to_user_id INTEGER, title TEXT, description TEXT, current_step TEXT, created_by_user_id INTEGER)"
            );
        });
    }

    /*
################################################
# Grupo relacionado ao gerenciamento de perfil #
################################################
*/

    /**
     * Cria usuário master padrão
     */
    async #createDefaultMaster() {
        var user = await this.selectUserId("admin@admin.com", "senha");

        // caso ainda não tenha este usuário
        if (!user) {
            this.addNewUser("admin@admin.com", "senha", 1, 0, "Admin Master", "Admin");
        }
    }

    /**
     * Busca usuário com base no login e senha
     */
    async selectUserId(login, senha, is_blocked = 0) {
        var promisse = new Promise((resolve) => {
            this.#db.transaction((tx) => {
                tx.executeSql(
                    "SELECT id FROM tb_users WHERE login = ? AND passwd = ? AND is_blocked = ? LIMIT 1",
                    [login, senha, is_blocked ? 1 : 0],
                    (tx, result) => {
                        if (result && result.rows.length > 0) {
                            resolve(result.rows[0]);
                        } else {
                            resolve(undefined);
                        }
                    }
                );
            });
        });

        return await promisse.then((linha) => linha);
    }

    /**
     * Busca dados de usuário por ID
     */
    async selectUserFromId(userId) {
        var promisse = new Promise((resolve) => {
            this.#db.transaction((tx) => {
                tx.executeSql(
                    "SELECT id, is_admin, is_blocked, occupation, name, avatar, login FROM tb_users WHERE id = ?",
                    [userId],
                    (tx, result) => {
                        if (result && result.rows.length > 0) {
                            resolve(result.rows[0]);
                        } else {
                            resolve(undefined);
                        }
                    }
                );
            });
        });

        return await promisse.then((linha) => linha);
    }

    /**
     * Retorna se a senha de unlock está correta
     */
    async unlockUser(userId, senha) {
        var promisse = new Promise((resolve) => {
            this.#db.transaction((tx) => {
                tx.executeSql(
                    "SELECT COUNT(id) AS total FROM tb_users WHERE id = ? AND passwd = ?",
                    [userId, senha],
                    (tx, result) => {
                        if (result && result.rows.length > 0) {
                            resolve(result.rows[0].total > 0);
                        } else {
                            resolve(false);
                        }
                    }
                );
            });
        });

        return await promisse.then((linha) => linha);
    }

    /**
     * Busca dados de usuário por Email
     */
    async selectUserIdFromEmail(email) {
        var promisse = new Promise((resolve) => {
            this.#db.transaction((tx) => {
                tx.executeSql("SELECT id FROM tb_users WHERE login = ? LIMIT 1", [email], (tx, result) => {
                    if (result && result.rows.length > 0) {
                        resolve(result.rows[0]);
                    } else {
                        resolve(undefined);
                    }
                });
            });
        });

        return await promisse.then((linha) => linha);
    }

    /**
     * Verifica se o usurário está bloqueado
     */
    async isBlockedUserId(userId) {
        var promisse = new Promise((resolve) => {
            this.#db.transaction((tx) => {
                tx.executeSql("SELECT id, is_blocked FROM tb_users WHERE id = ? LIMIT 1", [userId], (tx, result) => {
                    if (result && result.rows.length > 0) {
                        resolve(result.rows[0]);
                    } else {
                        resolve(undefined);
                    }
                });
            });
        });

        return await promisse.then((linha) => {
            if (!linha) {
                return true;
            } else {
                return linha.is_blocked == 1;
            }
        });
    }

    /**
     * Verifica se o usurário é admin
     */
    async isAdminUserId(userId) {
        var promisse = new Promise((resolve) => {
            this.#db.transaction((tx) => {
                tx.executeSql("SELECT id, is_admin FROM tb_users WHERE id = ? LIMIT 1", [userId], (tx, result) => {
                    if (result && result.rows.length > 0) {
                        resolve(result.rows[0]);
                    } else {
                        resolve(undefined);
                    }
                });
            });
        });

        return await promisse.then((linha) => {
            if (!linha) {
                return true;
            } else {
                return linha.is_admin == 1;
            }
        });
    }

    /**
     * Busca todos os usuários, exceto o administrador master
     */
    async listAllUsers() {
        var promisse = new Promise((resolve) => {
            this.#db.transaction((tx) => {
                tx.executeSql(
                    "SELECT id, is_admin, is_blocked, occupation, name, avatar FROM tb_users WHERE login != 'admin@admin.com' ORDER BY name ASC",
                    [],
                    (tx, result) => {
                        if (result && result.rows.length > 0) {
                            resolve(result.rows);
                        } else {
                            resolve(undefined);
                        }
                    }
                );
            });
        });

        return await promisse.then((linhas) => linhas);
    }

    /**
     * Inserir novo usuário
     */
    async addNewUser(login, passwd, is_admin, is_blocked, occupation, name, avatar = null) {
        return new Promise((resolve, reject) => {
            this.#db.transaction((tx) => {
                tx.executeSql(
                    "INSERT INTO tb_users (login, passwd, is_admin, is_blocked, occupation, name, avatar) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    [login, passwd, is_admin ? 1 : 0, is_blocked ? 1 : 0, occupation, name, avatar],
                    (tx, res) => {
                        resolve(res);
                    },
                    (tx, error) => {
                        reject(error);
                    }
                );
            });
        });
    }

    /**
     * Atualizar usuário
     */
    async updateUser(userId, is_admin, is_blocked, occupation, name, avatar = null) {
        var userProfile = await this.selectUserFromId(userId);

        if (userProfile == undefined) {
            return -1; // erro de não existente
        }

        return new Promise((resolve, reject) => {
            this.#db.transaction((tx) => {
                tx.executeSql(
                    "UPDATE tb_users SET is_admin = ?, is_blocked = ?, occupation = ?, name = ?, avatar = ? WHERE id = ?",
                    [is_admin ? 1 : 0, is_blocked ? 1 : 0, occupation, name, avatar, userId],
                    (tx, res) => {
                        resolve(res);
                    },
                    (tx, error) => {
                        reject(error);
                    }
                );
            });
        });
    }

    /*
################################################
# Grupo relacionado ao gerenciamento de perfil #
################################################
*/
    /**
     * Retorna a contagem de todas as etapas para o usuário informado
     */
    async countAssingedToUserIdAllSteps(userId) {
        var count = {
            backlog: await this.countAssingedToUserIdStep(userId, Variables.BACKLOG_ID),
            priorizado: await this.countAssingedToUserIdStep(userId, Variables.PRIORIZADO_ID),
            emAndamento: await this.countAssingedToUserIdStep(userId, Variables.EM_ANDAMENTO_ID),
            finalizado: await this.countAssingedToUserIdStep(userId, Variables.FINALIZADO_ID),
        };

        return count;
    }

    /**
     * Retorna a contagem de itens do step informado para o usuário informado
     */
    async countAssingedToUserIdStep(userId, step) {
        return new Promise((resolve, reject) => {
            this.#db.transaction((tx) => {
                tx.executeSql(
                    "SELECT COUNT(id) AS total FROM tb_kanban WHERE assigned_to_user_id = ? AND current_step = ?",
                    [userId, step],
                    (tx, res) => {
                        if (res && res.rows.length > 0) {
                            resolve(res.rows[0].total);
                        } else {
                            resolve(0);
                        }
                    },
                    (tx, error) => {
                        reject(error);
                    }
                );
            });
        });
    }

    /**
     * Retorna todas as tarefas do step informado
     */
    async getAllTastksOnStep(step, filterUserId = null) {
        var query = `SELECT id, assigned_to_user_id, title, description, current_step, created_by_user_id FROM tb_kanban WHERE current_step = ? ORDER BY id ASC`;

        if (filterUserId > 0) {
            query = `SELECT id, assigned_to_user_id, title, description, current_step, created_by_user_id FROM tb_kanban WHERE current_step = ? AND assigned_to_user_id = ${filterUserId} ORDER BY id ASC`;
        }

        return new Promise((resolve, reject) => {
            this.#db.transaction((tx) => {
                tx.executeSql(
                    query,
                    [step],
                    (tx, res) => {
                        if (res && res.rows.length > 0) {
                            resolve(res.rows);
                        } else {
                            resolve(undefined);
                        }
                    },
                    (tx, error) => {
                        reject(error);
                    }
                );
            });
        });
    }

    /**
     * Inserir nova tarefa
     */
    async addNewTask(title, description, assigned_to_user_id, current_step) {
        return new Promise((resolve, reject) => {
            this.#db.transaction((tx) => {
                tx.executeSql(
                    "INSERT INTO tb_kanban (title, description, assigned_to_user_id, current_step, created_by_user_id) VALUES (?, ?, ?, ?, ?)",
                    [title, description, assigned_to_user_id, current_step, sessionStorage.getItem("sessao_usuario")],
                    (tx, res) => {
                        resolve(res);
                    },
                    (tx, error) => {
                        reject(error);
                    }
                );
            });
        });
    }

    /**
     * Atualizar tarefa
     */
    async updateTask(taskId, title, description, assigned_to_user_id, current_step) {
        return new Promise((resolve, reject) => {
            this.#db.transaction((tx) => {
                tx.executeSql(
                    "UPDATE tb_kanban SET title = ?, description = ?, assigned_to_user_id = ?, current_step = ? WHERE id = ?",
                    [title, description, assigned_to_user_id, current_step, taskId],
                    (tx, res) => {
                        resolve(res);
                    },
                    (tx, error) => {
                        reject(error);
                    }
                );
            });
        });
    }

    /**
     * Retorna tarefa deste id
     */
    async selectTaskFromId(taskId) {
        return new Promise((resolve, reject) => {
            this.#db.transaction((tx) => {
                tx.executeSql(
                    "SELECT * FROM tb_kanban WHERE id = ?",
                    [taskId],
                    (tx, res) => {
                        if (res && res.rows.length > 0) {
                            resolve(res.rows[0]);
                        } else {
                            resolve(undefined);
                        }
                    },
                    (tx, error) => {
                        reject(error);
                    }
                );
            });
        });
    }
}

var DB = new Database();
