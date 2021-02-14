module.exports = {
  css: {
    loaderOptions: {
      sass: {
        data: `
          @import "@/variables.scss";
        `
      }
    }
  },
  devServer: {
    port: 5000
  }
}
