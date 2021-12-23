import http from "../http-common";

class IconifyDataService {
    
    getAll() {
      /*return http.get('https://api.iconify.design/search?query=emoji&limit=96')
      .then(res => {
        this.setState({
          students: res.data
        });
      })
      .catch((error) => {
        console.log(error);
      })*/
      return http.get('https://api.iconify.design/search?query=emoji&limit=96');
    }
    
    get(id) {
        return http.get(`/icons/${id}`);
    }
    getPng() {
      return http.get(`/convert`);
    }
    
      create(data) {
        return http.post("/icons", data);
      }
    
      update(id, data) {
        return http.put(`/icons/${id}`, data);
      }
    
      delete(id) {
        return http.delete(`/icons/${id}`);
      }
    
      deleteAll() {
        return http.delete(`/icons`);
      }
    
      findByTitle(title) {
        return http.get(`https://api.iconify.design/search?query=${title}&limit=96`);
        //return http.get(`/icons?title=${title}`);
      }
}

export default new IconifyDataService();