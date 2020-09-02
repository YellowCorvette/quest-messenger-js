import { Component, OnInit, Input,ViewChild, ChangeDetectorRef} from '@angular/core';
import { UiService} from '../services/ui.service';

import { QuestPubSubService } from '../services/quest-pubsub.service';

import { NgxFileDropEntry, FileSystemFileEntry, FileSystemDirectoryEntry } from 'ngx-file-drop';
import { NbSidebarService } from '@nebular/theme';
import { ConfigService } from '../services/config.service';

import { NbSortDirection, NbSortRequest, NbTreeGridDataSource, NbTreeGridDataSourceBuilder,NbGetters } from '@nebular/theme';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';


declare var $: any;

interface TreeNode<T> {
  data: T;
  children?: TreeNode<T>[];
  expanded?: boolean;
}

interface FSEntry {
  name: string;
  kind: string;
  items?: number;
}

@Component({
  selector: 'app-channel',
  templateUrl: './channel.component.html',
  styleUrls: ['./channel.component.scss']
})
export class ChannelComponent implements OnInit {

  customColumn = 'name';
    defaultColumns = [  'items' ];
    allColumns = [ this.customColumn, ...this.defaultColumns ];

    dataSource: NbTreeGridDataSource<FSEntry>;

    sortColumn: string;
    sortDirection: NbSortDirection = NbSortDirection.NONE;

    updateSort(sortRequest: NbSortRequest): void {
      this.sortColumn = sortRequest.column;
      this.sortDirection = sortRequest.direction;
    }

    getSortDirection(column: string): NbSortDirection {
      if (this.sortColumn === column) {
        return this.sortDirection;
      }
      return NbSortDirection.NONE;
    }



    getShowOn(index: number) {
      const minWithForMultipleColumns = 400;
      const nextColumnStep = 100;
      return minWithForMultipleColumns + (nextColumnStep * index);
    }


  @Input() channel: string;
  @ViewChild('newMessage') newMessage;

  constructor(private _sanitizer: DomSanitizer, private aChD: ChangeDetectorRef,private config: ConfigService, private ui: UiService, private pubsub: QuestPubSubService, private sidebarService: NbSidebarService, private dataSourceBuilder: NbTreeGridDataSourceBuilder<FSEntry>) {
    //parse channels

    let data = this.config.getChannelFolderList();
    this.dataSource = this.dataSourceBuilder.create(data);
  }



  DEVMODE = false;

  stringifyStore;
  settingsLoaded = false;
  ngOnInit(): void {


    this.settingsLoaded = this.ui.settingsLoaded;

    this.ui.settingsLoadedSub.subscribe( (value) => {
      this.settingsLoaded = value;
    });



    let uiCheck = setInterval( () =>{
      try{
        let fullPListArr = this.pubsub.getChannelParticipantList(this.channel)['cList'].split(',');
        if(fullPListArr.length > 0){
          for(let i=0;i<fullPListArr.length;i++){
            fullPListArr[i] =   fullPListArr[i].substr(130);
          }
        }
        this.channelParticipantListArray = fullPListArr;
      }
      catch(e){}

    },60000);

    try{
      let fullPListArr = this.pubsub.getChannelParticipantList(this.channel)['cList'].split(',');
      if(fullPListArr.length > 0){
        for(let i=0;i<fullPListArr.length;i++){
          fullPListArr[i] =   fullPListArr[i].substr(130);
        }
      }
      this.channelParticipantListArray = fullPListArr;
    }
    catch(e){}

    this.channelNameList = this.pubsub.getChannelNameList();


    this.beeProcessing = true;

    //load channel
    if(this.settingsLoaded){
      this.attemptJoinChannel(this.channel);
    }


    this.sideBarFixed = this.config.getSideBarFixed();
    this.sideBarVisible = this.config.getSideBarVisible();
    console.log('toggling:',this.sideBarVisible);
    if(!this.sideBarVisible['left']){
      this.sidebarService.collapse('left');
    }
    else if(this.sideBarVisible['left']){
      this.sidebarService.expand('left');
    }
    if(!this.sideBarVisible['right']){
      this.sidebarService.collapse('right');
    }
    if(this.sideBarVisible['right']){
      this.sidebarService.expand('right');
    }

    setTimeout( () => {
          this.sideBarFixed = this.config.getSideBarFixed();
          this.sideBarVisible = this.config.getSideBarVisible();
          console.log('toggling:',this.sideBarVisible);
          if(!this.sideBarVisible['left']){
            this.sidebarService.collapse('left');
          }
          else if(this.sideBarVisible['left']){
            this.sidebarService.expand('left');
          }
          if(!this.sideBarVisible['right']){
            this.sidebarService.collapse('right');
          }
          if(this.sideBarVisible['right']){
            this.sidebarService.expand('right');
          }
    },100);

    setTimeout( () => {
      this.config.sideBarFixedSub.subscribe( (sideBarFixed) => {
        console.log('getting',sideBarFixed);
        this.sideBarFixed = sideBarFixed
      });

      this.config.sideBarVisibleSub.subscribe( (sideBarVisible) => {
          console.log('toggling:',sideBarVisible);
        this.sideBarVisible = sideBarVisible;
        if(!this.sideBarVisible['left']){
          this.sidebarService.collapse('left');
        }
        else if(this.sideBarVisible['left']){
          this.sidebarService.expand('left');
        }
        if(!this.sideBarVisible['right']){
          this.sidebarService.collapse('right');
        }
        else if(this.sideBarVisible['right']){
          this.sidebarService.expand('right');
        }
      });

      this.config.channelFolderListSub.subscribe( (chFL: []) => {

         this.dataSource = this.dataSourceBuilder.create(chFL);
      });

    },1500);



}
  channelParticipantListArray = [];
  channelNameList = [];

  public showChallengeScreen = true;

  beeProcessing = false;



  selectChannel(channelName){
      console.log("trying to select: ",channelName);
      if(this.pubsub.isInArray(channelName,this.pubsub.getChannelNameList())){
        console.log('selecting: ',channelName);
        this.pubsub.selectChannel(channelName);
      }
  }

  challengeFail(){
    this.beeProcessing = false;
    this.showChallengeScreen = true;
    this.ui.updateProcessingStatus(false);
    this.ui.setElectronSize('0-keyimport');
    //we didn't prove that we are human when first initializing the quest
    this.ui.showSnack('Prove that you are smart', 'Please',{duration:4000});
    return false;
  }

  captchaCode;
  completedChallenge(){
    setTimeout( () => {
      this.ui.updateProcessingStatus(false);

    },30000);
    this.ui.updateProcessingStatus(true);
    this.pubsub.completedChallenge(this.channel, this.captchaCode);
  }

  messages = [];

  captchaImageResource: SafeUrl;
  async handleNewMessage(pubObj){
    if(pubObj['type'] == "CHALLENGE" ){

      console.log('Received Challenge');
      let imageBuffer = pubObj['captchaImageBuffer'];
      let imageB64 = Buffer.from(imageBuffer.data).toString('base64');

      this.captchaImageResource = this._sanitizer.bypassSecurityTrustUrl("data:image/png;base64,"+imageB64);
      this.showChallengeScreen = true;
      this.ui.updateProcessingStatus(false);
      this.aChD.detectChanges();
      // this.challengeFail()

    }
    else if(pubObj['type'] == "ownerSayHi"){
      //load chat
      this.beeProcessing = false;
      this.ui.updateProcessingStatus(false);
      this.showChallengeScreen = false;
      this.aChD.detectChanges();
    }
    else if(pubObj['type'] == "CHANNEL_MESSAGE"){
      pubObj['participant'] = {};
      if(pubObj['self']){
        pubObj['reply'] = true;
      }
      else{
        pubObj['reply'] = false;
      }
      pubObj['channelPubKey'] = pubObj['channelPubKey'].substr(130);
      pubObj['participant']['avatar'] = "./assets/defaultAvatar.png";
      this.messages.push(pubObj);
      this.aChD.detectChanges();
    }

    return true;
  }

  async attemptJoinChannel(channel){
    console.log('attempting to join: ',channel);
    try{
        if(!this.pubsub.isSubscribed(this.channel)){
          await this.pubsub.joinChannel(channel);
        }
        this.ui.showSnack('Loading Channel...','All right', {duration: 2500});
        this.ui.enableTab('channelTab');
        this.ui.disableTab('signInTab');
        this.beeProcessing = false;
        let messageHistory = this.pubsub.getChannelHistory(this.channel);
        this.DEVMODE && console.log('got history: ',messageHistory);
        for(let i = 0;i<messageHistory.length;i++){
          await this.handleNewMessage(messageHistory[i]);
        }
        this.pubsub.listen(channel).subscribe( async (pubObj) => {
          await this.handleNewMessage(pubObj)
        });

        let isOwner = this.pubsub.isOwner(channel,this.pubsub.getChannelKeyChain(channel)['channelPubKey']);
        console.log('isOwner:',isOwner);
        if(isOwner){
          this.showChallengeScreen = false;
          this.ui.updateProcessingStatus(false);
        }
    }
    catch(error){
      if(error == 'reCaptcha'){
        return this.challengeFail();
      }
      else if(error == 'key invalid'){
        this.ui.showSnack('Invalid Key!','Start Over',{duration:8000});
        this.ui.delay(2000);
        //window.location.reload(;
        return false;
      }
      else{
        this.ui.showSnack('Swarm Error =(','Start Over', {duration:8000});
        console.log(error);
        await this.ui.delay(5000);
      //  window.location.reload();
        return false;
      }
    }
  }

  async publishChannelMessage(event){
    this.pubsub.publishChannelMessage(this.channel, event.message);
    this.newMessage.nativeElement.value = "";
  }


  sideBarFixed = { right: true, left: true };
  sideBarVisible = { right: false, left: true };


   zeroandone = 0;
   lockSideBar(side,value){
     this.sideBarFixed[side] = value;
     this.config.setSideBarFixed(this.sideBarFixed);
     this.config.commitNow();
   }

    toggleSideBar(side) {
      this.sideBarVisible = this.config.getSideBarVisible();
      if( this.sideBarVisible[side] == true ){
        this.sideBarVisible[side]  = false;
      }
      else{
        this.sideBarVisible[side]  = true;
      }
      this.config.setSideBarVisible(this.sideBarVisible);
      this.config.commitNow();

    }
    //
    // toggleCompact() {
    //   this.sidebarService.toggle(true, 'right');
    // }



}