export type RtspUrl = string & { __brand: RtspUrl };
export class Type { 
    private static RTSP_REGREX = /^rtsp:\/\/(?:([^:@]+)(?::([^@]+))?@)?([^:/]+)(?::(\d+))?(\/.*)?$/;
    constructor(){}
    /**
     * checks if provided url is valid and convert url type to RtspUrl throw an Error if its not valid
     * @param url RTSPURL in string type
     * @returns RTSPURL in RtspUrl type
     */
    static toRtspUrl(url: string) {
        if (!this.RTSP_REGREX.test(url)) {
            throw new Error("invalid RTSP URL")
        }
        return url as RtspUrl
    }
}
export const RtspUrlSample=Type.toRtspUrl("rtsp://admin:admin@192.168.0.10:554/cam/realmonitor?channel=1&subtype=0")