/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    let collection = new Collection({
        type: "auth",
        name: "admin",
        listRule: "@request.auth.admin_flag = true",
        viewRule: "@request.auth.admin_flag = true",
        createRule: null,
        updateRule: "@request.auth.admin_flag = true",
        deleteRule: "@request.auth.admin_flag = true",
        fields: [
        {
                "hidden": false,
                "id": "bool5385564530",
                "name": "admin_flag",
                "presentable": false,
                "primaryKey": false,
                "required": false,
                "system": false,
                "type": "bool"
        }
],
        authAlert: { enabled: false },
    })

    try {
        app.save(collection)
    } catch (e) {
        if (e.message.includes("Collection name must be unique")) {
            console.log("Collection already exists, skipping")
            return
        }
        throw e
    }
}, (app) => {
    try {
        let collection = app.findCollectionByNameOrId("admin")
        app.delete(collection)
    } catch (e) {
        if (e.message.includes("no rows in result set")) {
            console.log("Collection not found, skipping revert");
            return;
        }
        throw e;
    }
})