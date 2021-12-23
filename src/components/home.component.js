import React, { Component } from "react";
import IconifyDataService from "../services/iconify.service";
//import { Link } from "react-router-dom";
//import { listIcons } from '@iconify/react';
import { Icon } from '@iconify/react';
import { listIcons } from '@iconify/react';
import { ReactSearchAutocomplete } from 'react-search-autocomplete';
import { SketchPicker } from "react-color";
import reactCSS from 'reactcss';

export default class Home extends Component {
    constructor(props) {
      super(props);
      
      this.onChangeSearchTitle = this.onChangeSearchTitle.bind(this);
      this.retrieveIcons = this.retrieveIcons.bind(this);
      this.refreshList = this.refreshList.bind(this);
      this.setActiveIcon = this.setActiveIcon.bind(this);
      this.removeAllIcons = this.removeAllIcons.bind(this);
      this.searchTitle = this.searchTitle.bind(this);
      this.onClick = this.onClick.bind(this);
      this.onChange = this.onChange.bind(this);
      this.saveSVGIcon = this.saveSVGIcon.bind(this);
      
      this.state = {
        icons: [],
        currentIcon: null,
        currentIndex: -1,
        searchTitle: "",
        displayClrPkr: false,
        color: {
          r: '215',
          g: '159',
          b: '55',
          a: '1',
        },
        pngUrl: ''
      };

    }
    onClick = (event) => {
      this.state.currentIcon = '';
      this.setState({ 
        displayClrPkr: !this.state.displayClrPkr 
      })
      this.setState({ 
        currentIcon: event.target
      })
      
      if(event.target.tagName == 'svg') {
        
        setTimeout(function(){
          var mainDiv = document.querySelector('.sketch-picker');
          const divip = document.createElement('div');
          divip.className = 'icon_preview';
          //console.log(event.target.parentNode.innerHTML);
          //var G = event.target.parentNode.innerHTML;
          divip.innerHTML = event.target.parentNode.innerHTML;
          //console.log(typeof divip)
          mainDiv.prepend(divip);
          console.log('clicked');
        }, 100); 
        
      }
      if(event.target.tagName == 'path') {
       
        setTimeout(function(){
          var mainDiv = document.querySelector('.sketch-picker');
          const divip = document.createElement('div');
          divip.className = 'icon_preview';
          //console.log(event.target.parentNode.parentNode.parentNode.innerHTML);
          divip.innerHTML = event.target.parentNode.parentNode.parentNode.innerHTML;
          //console.log(typeof divip)
          mainDiv.prepend(divip);
        }, 100); 
      }
      //iconsContianer
      //icon_preview
      //event.target.fill = this.state.color;
      
      //this.setActiveIcon();
    };

    stateClose = () => {
      this.setState({ 
        displayClrPkr: false 
      })
    };

    onChange = (color) => {
        this.setState({ 
          color: color.rgb 
        })
        var iconsvn = document.querySelector('.icon_preview svg')
        //this.state.currentIcon.style.color = color.hex;
        iconsvn.style.color = color.hex;
        //console.log(iconsvn);
    };
    saveSVGIcon = (event) =>{
      var svg = document.querySelector('.icon_preview svg');
      //get svg source.
      var serializer = new XMLSerializer();
      var source = serializer.serializeToString(svg);

      //add name spaces.
      if(!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)){
          source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
      }
      if(!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)){
          source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
      }

      //add xml declaration
      source = '<?xml version="1.0" standalone="no"?>\r\n' + source;

      //convert svg source to URI data scheme.
      var url = "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(source);
      //var base64Data = req.rawBody.replace(/^data:image\/png;base64,/, "");
      /*var buf = new Buffer(encodeURIComponent(source), 'base64');
      var fs = require('browserify-fs');
      //fs.writeFile('image123.png', buf);
      fs.writeFile('image123.svg', buf, (err) => {
        if (err) return console.error(err)
        console.log('file saved to ', 'image123.svg')
      })*/
      
      
      /*fs.writeFile('out.svg', source, (err) => {
      if (err) throw err;
      console.log('The file has been saved!');
      });*/
     
      //console.log('url='+url);
      return IconifyDataService.getPng(url)
        .then(response => {
          this.setState({
            pngUrl: response
          });
          
          console.log(response);
        })
        .catch(e => {
          console.log(e);
        });
      
    };
    componentDidMount() {
      this.retrieveIcons();
    }
  
    handleOnSearch = (string, results) => {
      // onSearch will have as the first callback parameter
      // the string searched and for the second the results.
      results = this.onChangeSearchTitle(string)
      
      //console.log('results='+results);
      //console.log(string, results);
    }
  
    handleOnHover = (result) => {
      // the item hovered
      //console.log(result)
    }
  
    handleOnSelect = (item) => {
      // the item selected
      //console.log(item)
    }
  
    handleOnFocus = () => {
      //console.log('Focused')
    }
  
    formatResult = (item) => {
      //return item
      return (<div classname="if_item" dangerouslySetInnerHTML={{__html: '<strong>'+item+'</strong>'}}></div>); //To format result as html
    }

    onChangeSearchTitle(searchTitle) {
      //console.log('searchTitle='+searchTitle)
      return IconifyDataService.findByTitle(searchTitle)
        .then(response => {
          this.setState({
            icons: response.data.icons
          });
          
          //console.log(response.data);
        })
        .catch(e => {
          console.log(e);
        });
    }
  
    retrieveIcons() {
      IconifyDataService.getAll()
        .then(response => {
          this.setState({
            //icons: JSON.stringify(response.data)
            icons: response.data.icons
          });
        })
        .catch(e => {
          console.log(e);
        });
    }

    refreshList() {
      this.retrieveIcons();
      this.setState({
        currentIcon: null,
        currentIndex: -1
      });
    }
  
    setActiveIcon(icon, index) {
      this.setState({
        currentIcon: icon,
        currentIndex: index
      });
    }
  
    removeAllIcons() {
      IconifyDataService.deleteAll()
        .then(response => {
          console.log(response.data);
          this.refreshList();
        })
        .catch(e => {
          console.log(e);
        });
    }
  
    searchTitle() {
      IconifyDataService.findByTitle(this.state.searchTitle)
        .then(response => {
          this.setState({
            icons: response.data
          });
          //console.log(response.data);
        })
        .catch(e => {
          console.log(e);
        });
    }
    
    render() {
      const { searchTitle, icons, currentIcon, currentIndex } = this.state;
      const styles = reactCSS({
        'default': {
          color: {
            width: '50px',
            height: '20px',
            borderRadius: '4px',
            background: `rgba(${ this.state.color.r }, ${ this.state.color.g }, ${ this.state.color.b }, ${ this.state.color.a })`,
          },
          popover: {
            position: 'absolute',
            zIndex: '2',
          },
          cover: {
            top: '0px',
            right: '0px',
            bottom: '0px',
            left: '0px',
            position: 'static',            
          },
                   
        },
      });
      //console.log('listicons='+listIcons());
      //console.log('icons='+this.state.icons);
      return (
        <div className="container">
          <div className="col-md-12">
            <div>
              <div className="App">
                <header className="App-header">
                  
                  <div className="if_container">
                    <ReactSearchAutocomplete
                      items={this.state.icons}
                      onSearch={this.handleOnSearch}
                      //onHover={this.handleOnHover}
                      //onSelect={this.handleOnSelect}
                      onFocus={this.handleOnFocus}
                      onClear={this.retrieveIcons}
                      autoFocus
                      placeholder="Icon Finder"
                      formatResult={this.formatResult}
                      styling= { styles.color }
                    />
                    <div className="icon_conatiner">
                      {Object.entries(this.state.icons).map(([key, value]) => {
                      
                      return (
                        <div className="if_item" onClick={ this.onClick }>
                          <Icon style={{'fontSize': '30px'}} icon={value}/>
                        </div>
                      );

                      })}
                    </div>
                  </div>
                </header>
              </div>
            </div>
            <div>
          
          { this.state.displayClrPkr ? <div style={ styles.popover }>
            
            <div class="iconsContianer" style={ styles.cover } onClick={ this.stateClose }>X</div>
              
              <SketchPicker color={ this.state.color } onChange={ this.onChange } />
              <button type="button" class="btn btn-primary" onClick={this.saveSVGIcon}>Add Icon</button>        
            </div> : null }
 
        </div>
          </div>
          <div>

          

        </div>
          
        </div>
        
      );
    }
}
