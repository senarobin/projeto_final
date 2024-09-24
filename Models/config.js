import mongoose from "mongoose";

const nupexSchema = new mongoose.Schema({
    matricula: {
        type: String,
        required: true
    },
    senha: {
        type: String,
        required: true
    },
    tipoUsuario: {
        type: String,
        required: true
    },
    categoria: {
        type: String,
        required: false 
    }
});

const NupexModel = mongoose.model('nupexlogin0', nupexSchema);

export default NupexModel;
