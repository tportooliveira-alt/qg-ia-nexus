/**
 * 🔌 PLUGIN MANAGER — Registry de Plugins do Nexus
 *
 * Carrega e expõe plugins disponíveis como um mapa nomeado.
 * Para adicionar um novo plugin: importe-o aqui e inclua no objeto `plugins`.
 */

const FabricaPlugin = require('./fabricaPlugin');
const StitchMcp = require('./stitchMcp');

const plugins = {
  fabricaIA: FabricaPlugin,
  stitch: StitchMcp
};

const PluginManager = {
  /**
   * Retorna um plugin pelo nome.
   * @param {string} nome - Nome do plugin (ex: 'fabricaIA')
   * @returns {object|null}
   */
  get(nome) {
    return plugins[nome] || null;
  },

  /**
   * Retorna todos os plugins disponíveis.
   * @returns {object}
   */
  todos() {
    return plugins;
  },

  /**
   * Lista os nomes dos plugins carregados.
   * @returns {string[]}
   */
  listar() {
    return Object.keys(plugins);
  }
};

module.exports = PluginManager;
